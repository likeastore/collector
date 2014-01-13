var request = require('request');
var moment = require('moment');
var util = require('util');

var scheduleTo = require('../scheduleTo');
var logger = require('./../../utils/logger');
var handleUnexpected = require('../handleUnexpected');
var config = require('../../../config');

var API = 'https://www.behance.net/v2';

function connector(state, callback) {
	var accessToken = state.accessToken;
	var username = state.username;
	var log = logger.connector('behance');

	if (!accessToken) {
		return callback('missing accessToken for user: ' + state.user);
	}

	if (!username) {
		return callback('missing username for user: ' + state.user);
	}

	initState(state);

	log.info('prepearing request in (' + state.mode + ') mode for user: ' + state.user);

	var uri = formatRequestUri(accessToken, username, state);
	var headers = { 'Content-Type': 'application/json', 'User-Agent': 'likeastore/collector'};

	request({uri: uri, headers: headers, timeout: config.collector.request.timeout, json: true}, function (err, response, body) {
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

	function formatRequestUri(accessToken, username, state) {
		var base = util.format('%s/users/%s/appreciations?access_token=%s', API, username, accessToken);
		return state.mode === 'initial' && state.page ?
			util.format('%s&page=%s', base, state.page) :
			base;
	}

	function handleResponse(response, body) {
		var rateLimit = response.statusCode === 429 ? 0 : 9999;
		var appreciations = body.appreciations;

		log.info('rate limit remaining: ' +  rateLimit + ' for user: ' + state.user);

		if (!Array.isArray(appreciations)) {
			return handleUnexpected(response, body, state, function (err) {
				callback(err, scheduleTo(updateState(state, [], rateLimit, true)));
			});
		}

		var stars = appreciations.map(function (r) {
			return {
				itemId: r.project.id.toString(),
				idInt: r.project.id,
				user: state.user,
				created: moment.unix(r.project.created_on).toDate(),
				title: r.project.name,
				authorName: first(r.project.owners).display_name,
				authorUrl: first(r.project.owners).url,
				avatarUrl: best(first(r.project.owners).images),
				source: r.project.url,
				thumbnail: best(r.project.covers),
				type: 'behance'
			};
		});

		log.info('retrieved ' + stars.length + ' appreciations for user: ' + state.user);

		return callback(null, scheduleTo(updateState(state, stars, rateLimit, false)), undefined);

		function first(array) {
			return array[0];
		}

		function best(object) {
			var sorted = Object.keys(object).sort();
			return object[sorted[sorted.length - 1]];
		}
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

module.exports = connector;