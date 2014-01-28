var request = require('request');
var moment = require('moment');
var util = require('util');

var scheduleTo = require('../scheduleTo');
var logger = require('./../../utils/logger');
var handleUnexpected = require('../handleUnexpected');
var config = require('../../../config');

var API = 'https://www.googleapis.com/youtube/v3';

function connector(state, user, callback) {
	var log = logger.connector('youtube');

	if (state.unauthorized && state.refreshToken) {
		return refreshAccessToken(state, connect);
	}

	connect(null, state);

	function connect(err, state) {
		if (err) {
			return callback(err);
		}

		var accessToken = state.accessToken;

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
	}

	// TODO: move to common function, seems the same for all collectors?
	function initState(state) {
		if (!state.mode) {
			state.mode = 'initial';
		}

		if (!state.errors) {
			state.errors = 0;
		}

		if (state.mode === 'rateLimit') {
			state.mode = state.prevMode;
		}
	}

	function formatRequestUri(accessToken, state) {
		var base = util.format('%s/activities?part=contentDetails%2Csnippet&maxResults=50&mine=true&access_token=%s', API, accessToken);
		return state.mode === 'initial' && state.nextPageToken ?
			util.format('%s&pageToken=%s', base, state.nextPageToken) :
			base;
	}

	function refreshAccessToken(state, callback) {
		var refreshToken = state.refreshToken;

		if (!refreshToken) {
			return callback('missing refreshToken for user: ' + state.user);
		}

		var refreshTokenUrl = 'https://accounts.google.com/o/oauth2/token';
		var headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'likeastore/collector'};
		var data = {
			'client_id': config.services.youtube.clientId,
			'client_secret': config.services.youtube.clientSecret,
			'refresh_token': refreshToken,
			'grant_type': 'refresh_token'
		};

		logger.info('refreshing accessToken for user: ' + state.user);

		request.post({url: refreshTokenUrl, headers: headers, form: data, json: true}, function (err, response, body) {
			if (err || !body.access_token) {
				return callback(err, state);
			}

			state.accessToken = body.access_token;
			delete state.unauthorized;
			delete state.errors;

			logger.info('accessToken refreshed for user: ' + state.user);

			callback(null, state);
		});
	}

	function handleResponse(response, body) {
		var items = body.items;

		if (!Array.isArray(items)) {
			return handleUnexpected(response, body, state, function (err) {
				callback(err, scheduleTo(updateState(body, state, [], 9999, true)));
			});
		}

		var likes = items.filter(function (item) {
			return item.snippet.type === 'like';
		}).map(function (video) {
			return {
				itemId: video.contentDetails.like.resourceId.videoId,
				user: state.user,
				userData: user,
				created: moment(video.snippet.publishedAt).toDate(),
				description: video.snippet.description,
				title: video.snippet.title,
				authorName: null,
				authorUrl: null,
				avatarUrl: null,
				source: youtubeLink(video.contentDetails),
				thumbnail: video.snippet.thumbnails && video.snippet.thumbnails.high && video.snippet.thumbnails.high.url,
				type: 'youtube'
			};
		});

		log.info('retrieved ' + likes.length + ' likes for user: ' + state.user);

		return callback(null, scheduleTo(updateState(body, state, likes, 9999, false)), likes);

		function youtubeLink(details) {
			var id = details && details.like && details.like.resourceId && details.like.resourceId.videoId;
			return id && 'http://youtube.com/watch?v=' + id;
		}
	}

	function updateState(body, state, data, rateLimit, failed) {
		state.lastExecution = moment().toDate();

		if (!failed) {
			if (state.mode === 'initial' && body.nextPageToken) {
				state.nextPageToken = body.nextPageToken;
			}

			if (state.mode === 'initial' && !body.nextPageToken) {
				state.mode = 'normal';
				delete state.nextPageToken;
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