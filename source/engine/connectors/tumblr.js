var request = require('request');
var moment = require('moment');
var scheduleTo = require('../scheduleTo');
var util = require('util');

var handleUnexpected = require('../handleUnexpected');
var logger = require('./../../utils/logger');
var config = require('../../../config');

var API = 'http://api.tumblr.com/v2';

function connector(state, user, callback) {
	var accessToken = state.accessToken;
	var accessTokenSecret = state.accessTokenSecret;
	var log = logger.connector('tumblr');

	if (!accessToken) {
		return callback('missing accessToken for user: ' + state.user);
	}

	if (!accessTokenSecret) {
		return callback('missing accessTokenSecret for user: ' + state.user);
	}

	initState(state);

	var uri = formatRequestUri(state);
	var headers = { 'Content-Type': 'application/json', 'User-Agent': 'likeastore/collector'};

	var oauth = {
		consumer_key: config.services.tumblr.consumerKey,
		consumer_secret: config.services.tumblr.consumerSecret,
		token: accessToken,
		token_secret: accessTokenSecret
	};

	log.info('prepearing request in (' + state.mode + ') mode for user: ' + state.user);

	request({uri: uri, headers: headers, oauth: oauth, timeout: config.collector.request.timeout, json: true}, function (err, response, body) {
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

	function formatRequestUri(state) {
		var pageSize = 20;
		var base = util.format('%s/user/likes?limit=%s', API, pageSize);
		return state.mode === 'initial' ? util.format('%s&offset=%s', base, state.page * pageSize) : base;
	}

	function initState(state) {
		if (!state.mode) {
			state.mode = 'initial';
		}

		if (!state.errors) {
			state.errors = 0;
		}

		if (!state.page) {
			state.page = 0;
		}

		if (state.mode === 'rateLimit') {
			state.mode = state.prevMode;
		}
	}

	function handleResponse(response, body) {
		var list = body.response.liked_posts;

		if (!Array.isArray(list)) {
			return handleUnexpected(response, body, state, 'unexpected response', function (err) {
				callback(err, scheduleTo(updateState(state, body.response, [], 9999, true)));
			});
		}

		var likes = list.map(function (fav) {
			return {
				itemId: fav.id.toString(),
				idInt: fav.id,
				user: state.user,
				userData: user,
				created: moment(fav.date).toDate(),
				authorName: fav.blog_name,
				source: fav.post_url,
				title: fav.title,
				thumbnail: fav.photos && fav.photos[0] && fav.photos[0].original_size.url,
				type: 'tumblr'
			};
		});

		log.info('retrieved ' + likes.length + ' likes for user: ' + state.user);

		return callback(null, scheduleTo(updateState(state, body.response, likes, 9999, false)), likes);
	}

	function updateState(state, response, data, rateLimit, failed) {
		state.lastExecution = moment().toDate();

		if (!failed) {
			if (state.mode === 'initial' && data.length > 0) {
				state.page += 1;
			}

			if (state.mode === 'initial' && (data.length === 0 || state.page * 20 >  response.liked_count)) {
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

module.exports = connector;