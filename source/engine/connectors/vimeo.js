var _ = require('underscore');
var request = require('request');
var moment = require('moment');
var scheduleTo = require('../scheduleTo');
var util = require('util');

var handleUnexpected = require('../handleUnexpected');
var logger = require('./../../utils/logger');
var config = require('../../../config');

var API = 'http://vimeo.com/api/rest/v2?format=json&method=vimeo.videos.getLikes';

function connector(state, user, callback) {
	var accessToken = state.accessToken;
	var accessTokenSecret = state.accessTokenSecret;
	var log = logger.connector('vimeo');

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
		consumer_key: config.services.vimeo.clientId,
		consumer_secret: config.services.vimeo.clientSecret,
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

	function formatRequestUri(state) {
		var base = util.format('%s&user_id=%s&sort=newest&per_page=50&full_response=1', API, state.accessToken);
		return state.mode === 'initial' || state.page ?
			util.format('%s&page=%s', base, state.page) :
			base;
	}

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
			state.page = 1;
		}

		if (state.mode === 'rateLimit') {
			state.mode = state.prevMode;
		}
	}

	function handleResponse(response, body) {
		var videos = body.videos && body.videos.video;

		if (!Array.isArray(videos)) {
			return handleUnexpected(response, body, state, function (err) {
				callback(err, scheduleTo(updateState(state, [], 9999, true)));
			});
		}

		var favorites = videos.map(function (video) {
			return {
				itemId: video.id,
				user: state.user,
				userData: user,
				created: moment(video.upload_date).toDate(),
				description: video.description,
				title: video.title,
				authorName: video.owner.display_name,
				authorUrl: video.owner.profileurl,
				avatarUrl: video.owner.portraits && video.owner.portraits.portrait && findWith('width', '100', video.owner.portraits.portrait, '_content'),
				source: video.urls && video.urls.url && findWith('type', 'video', video.urls.url, '_content'),
				thumbnail: video.thumbnails && video.thumbnails.thumbnail && findWith('width', '640', video.thumbnails.thumbnail, '_content'),
				type: 'vimeo'
			};
		});

		log.info('retrieved ' + favorites.length + ' favorites for user: ' + state.user);

		return callback(null, scheduleTo(updateState(state, favorites, 9999, false)), favorites);

		function findWith(prop, val, array, ret) {
			var found =  _.find(array, function (item) {
				return item[prop] === val;
			});

			return found && found[ret];
		}
	}

	function updateState(state, data, rateLimit, failed) {
		state.lastExecution = moment().toDate();

		if (!failed) {
			if (state.mode === 'initial' && data.length === 50) {
				state.page += 1;
			}

			if (state.mode === 'initial' && data.length < 50) {
				state.mode = 'normal';
				delete state.page;
			}
		}

		return state;
	}
}

module.exports = connector;