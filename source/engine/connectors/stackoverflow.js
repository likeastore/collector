var request = require('request');
var zlib = require('zlib');
var config = require('../../../config');
var logger = require('../../utils/logger');
var moment = require('moment');
var scheduleTo = require('../scheduleTo');
var util = require('util');
var handleUnexpected = require('../handleUnexpected');
var helpers = require('../../utils/helpers');

var API = 'https://api.stackexchange.com/2.1';

function connector(state, callback) {
	var accessToken = state.accessToken;
	var log = logger.connector('stackoverflow');

	if (!accessToken) {
		return callback('missing accessToken for user: ' + state.user);
	}

	initState(state);

	log.info('prepearing request in (' + state.mode + ') mode for user: ' + state.user);

	var uri = formatRequestUri(accessToken, state);
	var headers = { 'Content-Type': 'application/json', 'Accept-Encoding': 'gzip', 'User-Agent': 'likeastore/collector'};

	var stream = zlib.createGunzip();
	var unzippedResponse = '';

	stream.on('data', function (data) {
		unzippedResponse += data;
	});

	stream.on('error', function (err) {
		logger.error({message: 'failed to deflate stream', err: err, unzippedResponse: unzippedResponse});
	});

	stream.on('finish', function () {
		var response = JSON.parse(unzippedResponse);
		var rateLimit = +response.quota_remaining;
		log.info('rate limit remaining: ' + rateLimit + ' for user: ' + state.user);

		return handleResponse(response, rateLimit);
	});

	request({uri: uri, headers: headers}, function (err, res) {
		if (err) {
			return callback(err);
		}
	}).pipe(stream);

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
		var base = util.format('%s/me/favorites?access_token=%s&key=%s&pagesize=100&sort=activity&order=desc&site=stackoverflow', API, accessToken, config.services.stackoverflow.clientKey);
		return state.mode === 'initial' || state.page ?
			util.format('%s&page=%s', base, state.page) :
			base;
	}

	function handleResponse(body, rateLimit) {
		if (Array.isArray(body.items)) {
			var favorites = body.items.map(function (fav) {
				return {
					itemId: fav.question_id.toString(),
					idInt: fav.question_id,
					user: state.user,
					dateInt: fav.creation_date,
					created: moment.unix(fav.creation_date).toDate(),
					date: moment().toDate(),
					description: fav.title,
					authorName: fav.owner.display_name,
					avatarUrl: fav.owner.profile_image && fav.owner.profile_image.replace(/^http:\/\//i, 'https://'),
					source: 'http://stackoverflow.com/questions/' + fav.question_id,
					type: 'stackoverflow'
				};
			});

			log.info('retrieved ' + favorites.length + ' favorites for user: ' + state.user);

			return callback(null, scheduleTo(updateState(state, favorites, rateLimit)), favorites);
		}

		handleUnexpected(null, body, state, function (err) {
			callback(err, scheduleTo(updateState(state, [], rateLimit)));
		});
	}

	function updateState(state, data, rateLimit) {
		state.lastExecution = moment().toDate();

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

		return state;
	}
}

module.exports = connector;