var request = require('request');
var logger = require('./../../utils/logger');
var moment = require('moment');
var util = require('util');
var scheduleTo = require('../scheduleTo');
var helpers = require('./../../utils/helpers');

var API = 'https://api.github.com';

function connector(state, callback) {
	var accessToken = state.accessToken;
	var log = logger.connector('github');

	if (!accessToken) {
		return callback('missing accessToken for user: ' + state.userId);
	}

	initState(state);

	log.info('prepearing request in (' + state.mode + ') mode.');

	var uri = formatRequestUri(accessToken, state);
	var headers = { 'Content-Type': 'application/json', 'User-Agent': 'likeastore/collector'};

	request({uri: uri, headers: headers, json: true}, function (err, response, body) {
		if (err) {
			return callback('request failed: ' + err);
		}

		return handleResponse(response, body);
	});

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
		var base = util.format('%s/user/starred?access_token=%s&per_page=100', API, accessToken);
		return state.mode === 'initial' || state.page ?
			util.format('%s&page=%s', base, state.page) :
			base;
	}

	function handleResponse(response, body) {
		var rateLimit = +response.headers['x-ratelimit-remaining'];
		log.info('rate limit remaining: ' +  rateLimit + ' for user: ' + state.userId);

		if (Array.isArray(body)) {
			var stars = body.map(function (r) {
				return {
					itemId: r.id.toString(),
					idInt: r.id,
					userId: state.userId,
					name: r.full_name,
					authorName: r.owner.login,
					authorUrl: r.owner.html_url,
					authorGravatar: r.owner.gravatar_id,
					avatarUrl: 'http://www.gravatar.com/avatar/' + r.owner.gravatar_id + '?d=mm',
					source: r.html_url,
					date: moment(r.created_at).format(),
					description: r.description,
					type: 'github'
				};
			});

			var newStars = filterNewStars(stars);
			log.info('retrieved ' + newStars.length + ' new stars');

			return callback(null, scheduleTo(updateState(state, stars, rateLimit)), newStars);
		}

		return callback({ message: 'Unexpected response type', body: body, state: state}, scheduleTo(updateState(state, [], rateLimit)));
	}

	function filterNewStars (stars) {
		if (state.mode === 'initial') {
			return stars;
		}

		return helpers.takeWhile(stars, function (star) {
			return +state.sinceId < star.idInt;
		});
	}

	function updateState(state, data, rateLimit) {
		if (state.mode === 'initial' && data.length > 0 && !state.sinceId) {
			state.sinceId = data[0].idInt;
		}

		if (state.mode === 'initial' && data.length > 0) {
			state.page += 1;
		}

		if (state.mode === 'normal' && data.length > 0) {
			state.sinceId = data[0].idInt;
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