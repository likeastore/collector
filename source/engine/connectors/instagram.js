var request = require('request');
var moment = require('moment');
var util = require('util');

var scheduleTo = require('../scheduleTo');
var logger = require('./../../utils/logger');
var handleUnexpected = require('../handleUnexpected');
var config = require('../../../config');

var API = 'https://api.instagram.com/v1';

function connector(state, user, callback) {
	var accessToken = state.accessToken;
	var log = logger.connector('instagram');

	if (!accessToken) {
		return callback('missing accessToken for user: ' + state.user);
	}

	initState(state);

	log.info('prepearing request in (' + state.mode + ') mode for user: ' + state.user);

	var uri = formatRequestUri(accessToken, state);
	var headers = { 'Content-Type': 'application/json', 'User-Agent': 'likeastore/collector'};

	request({uri: uri, headers: headers, timeout: config.collector.request.timeout, json: true}, function (err, response, body) {
		if (failed(err, response, body)) {
			return handleUnexpected(response, body, state, err, function (err) {
				callback (err, state);
			});
		}

		return handleResponse(response, body);
	});

	function failed(err, response, body) {
		return err || response.statusCode !== 200 || !body;
	}

	function initState(state) {
		if (!state.mode) {
			state.mode = 'initial';
		}

		if (!state.errors) {
			state.errors = 0;
		}

		if (state.mode === 'initial' && !state.page) {
			state.page = 0;
		}

		if (state.mode === 'rateLimit') {
			state.mode = state.prevMode;
		}
	}

	function formatRequestUri(accessToken, state) {
		var base = util.format('%s/users/self/media/liked?access_token=%s', API, accessToken);
		return state.maxId ? util.format('%s&max_like_id=%s', base, state.maxId) : base;
	}

	function handleResponse(response, body) {
		var rateLimit = +response.headers['x-ratelimit-remaining'];
		log.info('rate limit remaining: ' +  rateLimit + ' for user: ' + state.user);

		if (!Array.isArray(body.data)) {
			return handleUnexpected(response, body, state, 'unexpected response', function (err) {
				callback(err, scheduleTo(updateState(state, body, [], rateLimit, true)));
			});
		}

		var likes = body.data.map(function (r) {
			return {
				itemId: r.id,
				user: state.user,
				userData: user,
				authorName: r.user && r.user.username,
				authorUrl: 'https://instagram.com/' + (r.user && r.user.username),
				avatarUrl: r.user && r.user.profile_picture,
				source: r.link,
				created: moment.unix(r.created_time).toDate(),
				description: r.caption && r.caption.text,
				thumbnail: r.images && r.images.standard_resolution && r.images.standard_resolution.url,
				type: 'instagram'
			};
		});

		log.info('retrieved ' + likes.length + ' likes for user: ' + state.user);

		return callback(null, scheduleTo(updateState(state, body, likes, rateLimit, false)), likes);
	}

	function updateState(state, body, data, rateLimit, failed) {
		state.lastExecution = moment().toDate();

		if (!failed) {
			if (state.mode === 'initial' && body.pagination && body.pagination.next_max_like_id) {
				state.maxId = body.pagination.next_max_like_id;
			} else {
				state.mode = 'normal';
				delete state.maxId;
			}

			if (rateLimit <= 1) {
				var currentState = state.mode;
				state.mode = 'rateLimit';
				state.prevMode = currentState;
			}
		}

		return state;
	}
}

module.exports = connector;