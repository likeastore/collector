var request = require('request');
var moment = require('moment');
var util = require('util');

var scheduleTo = require('../scheduleTo');
var logger = require('./../../utils/logger');
var handleUnexpected = require('../handleUnexpected');
var config = require('../../../config');

var API = 'https://api.github.com';

function connect(state, user, callback) {
	var accessToken = state.accessToken;
	var log = logger.connector('gist');

	if (!accessToken) {
		return callback('missing accessToken for user: ' + state.user);
	}

	initState(state);

	log.info('prepearing request in (' + state.mode + ') mode for user: ' + state.user);

	var uri = formatRequestUri(accessToken, state);
	var headers = { 'Content-Type': 'application/json', 'User-Agent': 'likeastore/collector'};

	request({uri: uri, headers: headers, timeout: config.collector.request.timeout, json: true}, function (err, response, body) {
		if (err) {
			return handleUnexpected(response, body, state, err, function (err) {
				callback (err, state);
			});
		}

		return handleResponse(response, body);
	});

	// TODO: move to common function, seems the same for all collectors?
	function initState(state) {
		if (!state.mode) {
			state.mode = 'initial';
		}

		if (!state.errors) {
			state.errors = 0;
		}

		if (state.mode === 'initial' && !state.page) {
			state.page = 1;
		}

		if (state.mode === 'rateLimit') {
			state.mode = state.prevMode;
		}
	}

	function formatRequestUri(accessToken, state) {
		var pageSize = state.mode === 'initial' ? 100 : 50;
		var base = util.format('%s/gists/starred?access_token=%s&per_page=%s', API, accessToken, pageSize);
		return state.mode === 'initial' || state.page ?
			util.format('%s&page=%s', base, state.page) :
			base;
	}

	function handleResponse(response, body) {
		var rateLimit = +response.headers['x-ratelimit-remaining'];
		log.info('rate limit remaining: ' +  rateLimit + ' for user: ' + state.user);

		if (!Array.isArray(body)) {
			return handleUnexpected(response, body, state, function (err) {
				callback(err, scheduleTo(updateState(state, [], rateLimit, true)));
			});
		}

		var stars = body.map(function (r) {
			var gistOwner = r.user || {
				login: 'anonymous',
				html_url: null,
				gravatar_id: 'anon'
			};

			return {
				itemId: r.id.toString(),
				idInt: r.id,
				user: state.user,
				userData: user,
				repo: 'gist',
				authorName: gistOwner.login,
				authorUrl: gistOwner.html_url,
				authorGravatar: gistOwner.gravatar_id,
				avatarUrl: 'https://www.gravatar.com/avatar/' + gistOwner.gravatar_id + '?d=mm',
				source: r.html_url,
				created: moment(r.created_at).toDate(),
				description: r.description,
				gist: true,
				type: 'github'
			};
		});

		log.info('retrieved ' + stars.length + ' gists for user: ' + state.user);

		return callback(null, scheduleTo(updateState(state, stars, rateLimit, false)), stars);
	}

	function updateState(state, data, rateLimit, failed) {
		state.lastExecution = moment().toDate();

		if (!failed) {
			if (state.mode === 'initial' && data.length > 0) {
				state.page += 1;
			}

			if (state.mode === 'initial' && data.length === 0) {
				state.mode = 'normal';
				delete state.page;
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

module.exports = connect;