var request = require('request');
var zlib = require('zlib');
var MemoryStream = require('memstream').MemoryStream;
var logger = require('./../../utils/logger');
var moment = require('moment');
var scheduleTo = require('../scheduleTo');
var util = require('util');

var helpers = require('./../../utils/helpers');

var API = 'https://api.stackexchange.com/2.1';

function connector(state, callback) {
	var accessToken = state.accessToken;
	var log = logger.connector('stackoverflow');

	if (!accessToken) {
		return callback('missing accessToken for user: ' + state.userId);
	}

	initState(state);

	log.info('prepearing request in (' + state.mode + ') mode.');

	var uri = formatRequestUri(accessToken, state);
	var headers = { 'Content-Type': 'application/json', 'Accept-Encoding': 'gzip', 'User-Agent': 'likeastore/collector'};

	var response;
	var unzippedResponse = '';
	var stream = new MemoryStream(function (buffer) {
		unzippedResponse += buffer;
	}).on('end', function () {
		var rateLimit = +response.headers['x-ratelimit-current'];
		log.info('rate limit remaining: ' + rateLimit + ' for user: ' + state.userId);

		return handleResponse(JSON.parse(unzippedResponse), rateLimit);
	});

	request({uri: uri, headers: headers}, function (err, res) {
		if (err) {
			return callback(err);
		}
		response = res;
	}).pipe(zlib.createGunzip()).pipe(stream);

	function initState(state) {
		if (!state.mode) {
			state.mode = 'initial';
		}

		if (state.mode === 'initial' && !state.page) {
			state.page = 1;
		}

		if (state.mode === 'rateLimit') {
			state.mode = state.prevMode;
		}
	}

	function formatRequestUri(accessToken, state) {
		var base = util.format('%s/users/me/favorites?access_token=%s&pagesize=100&sort=creation', API, accessToken);
		return state.mode === 'initial' || state.page ?
			util.format('%s&page=%s', base, state.page) :
			state.mode === 'normal' ?
				util.format('%s&fromdate=%s', base, state.fromdate) :
				base;
	}

	function handleResponse(body, rateLimit) {
		if (Array.isArray(body.questions)) {
			var favorites = body.questions.map(function (fav) {
				return {
					itemId: fav.question_id.toString(),
					userId: state.userId,
					dateInt: fav.creation_date,
					date: moment.unix(fav.creation_date).format(),
					description: fav.title,
					authorName: fav.owner.display_name,
					avatarUrl: 'http://gravatar.com/avatar/' + fav.owner.email_hash + '?d=mm',
					source: 'http://stackoverflow.com/questions/' + fav.question_id,
					favorites: fav.favorite_count,
					type: 'stackoverflow'
				};
			});

			log.info('retrieved ' + favorites.length + ' favorites');

			return callback(null, scheduleTo(updateState(state, favorites, rateLimit)), favorites);
		}

		return callback({ message: 'Unexpected response type', body: body, state: state}, scheduleTo(updateState(state, [], rateLimit)));
	}

	function updateState(state, data, rateLimit) {
		if (state.mode === 'initial' && data.length > 0 && !state.fromdate) {
			state.fromdate = data[0].dateInt + 1;
		}

		if (state.mode === 'initial' && data.length > 0) {
			state.page += 1;
		}

		if (state.mode === 'initial' && data.length === 0) {
			state.mode = 'normal';
			delete state.page;
		}

		if (state.mode === 'normal' && data.length > 0) {
			state.fromdate = data[0].dateInt + 1;
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