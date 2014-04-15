var request = require('request');
var moment = require('moment');
var scheduleTo = require('../scheduleTo');
var util = require('util');

var handleUnexpected = require('../handleUnexpected');
var helpers = require('./../../utils/helpers');
var logger = require('./../../utils/logger');
var config = require('../../../config');

var API = 'https://api.flickr.com/services/rest';

function connector(state, user, callback) {
	var accessToken = state.accessToken;
	var accessTokenSecret = state.accessTokenSecret;
	var log = logger.connector('flickr');

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
		consumer_key: config.services.flickr.consumerKey,
		consumer_secret: config.services.flickr.consumerSecret,
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

	function initState(state) {
		if (!state.mode) {
			state.mode = 'initial';
		}

		if (!state.errors) {
			state.errors = 0;
		}

		if (!state.page) {
			state.page = 1;
		}

		if (state.mode === 'rateLimit') {
			state.mode = state.prevMode;
		}
	}

	function formatRequestUri(state) {
		var base = util.format(
			'%s?api_key=%s&format=json&nojsoncallback=1&method=flickr.favorites.getList&extras=description,owner_name,url_c&page=%s',
			API,
			config.services.flickr.consumerKey,
			state.page);

		return base;
	}

	function handleResponse(response, body) {
		var photos = body.photos && body.photos.photo;

		if (!Array.isArray(photos)) {
			return handleUnexpected(response, body, state, function (err) {
				callback(err, scheduleTo(updateState(state, body, [], 9999, true)));
			});
		}

		var favorites = photos.map(function (fav) {
			return {
				itemId: fav.id,
				user: state.user,
				userData: user,
				created: moment.unix(fav.date_faved).toDate(),
				description: fav.description && fav.description._content,
				authorName: fav.ownername,
				source: fav.url_c,
				thumbnail: fav.url_c,
				type: 'flickr'
			};
		});

		log.info('retrieved ' + favorites.length + ' favorites for user: ' + state.user);

		return callback(null, scheduleTo(updateState(state, body, favorites, 9999, false)), favorites);
	}

	function updateState(state, body, data, rateLimit, failed) {
		state.lastExecution = moment().toDate();

		if (!failed) {
			if (state.mode === 'initial' && state.page < body.pages) {
				state.page += 1;
			} else {
				state.mode = 'normal';
				state.page = 1;
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