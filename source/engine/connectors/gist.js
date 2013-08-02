var request = require('request');
var logger = require('./../../utils/logger');
var moment = require('moment');
var util = require('util');
var scheduleTo = require('../scheduleTo');
var handleUnexpected = require('../handleUnexpected');
var helpers = require('../../utils/helpers');

var API = 'https://api.github.com';

function connect(state, callback) {
	var accessToken = state.accessToken;
	var log = logger.connector('gist');

	if (!accessToken) {
		return callback('missing accessToken for user: ' + state.user);
	}

	initState(state);

	log.info('prepearing request in (' + state.mode + ') mode for user: ' + state.user);

	var uri = formatRequestUri(accessToken, state);
	var headers = { 'Content-Type': 'application/json', 'User-Agent': 'likeastore/collector'};

	request({uri: uri, headers: headers, json: true}, function (err, response, body) {
		if (err) {
			return handleUnexpected(response, body, state, err, function (err) {
				callback (err, state);
			});
		}

		return handleResponse(response, body);
	});

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
		var base = util.format('%s/gists/starred?access_token=%s&per_page=100', API, accessToken);
		return state.mode === 'initial' || state.page ?
			util.format('%s&page=%s', base, state.page) :
			base;
	}

	function handleResponse(response, body) {
		var rateLimit = +response.headers['x-ratelimit-remaining'];
		log.info('rate limit remaining: ' +  rateLimit + ' for user: ' + state.user);

		if (Array.isArray(body)) {
			var stars = body.map(function (r) {
				var user = r.user || {
					login: 'anonymous',
					html_url: null,
					gravatar_id: 'anon'
				};

				return {
					itemId: r.id.toString(),
					idInt: r.id,
					user: state.user,
					repo: 'gist',
					authorName: user.login,
					authorUrl: user.html_url,
					authorGravatar: user.gravatar_id,
					avatarUrl: 'https://www.gravatar.com/avatar/' + user.gravatar_id + '?d=mm',
					source: r.html_url,
					created: moment(r.created_at).toDate(),
					date: moment().toDate(),
					description: r.description,
					gist: true,
					type: 'github'
				};
			});

			log.info('retrieved ' + stars.length + ' gists for user: ' + state.user);

			return callback(null, scheduleTo(updateState(state, stars, rateLimit)), stars);
		}

		handleUnexpected(response, body, state, function (err) {
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

module.exports = connect;