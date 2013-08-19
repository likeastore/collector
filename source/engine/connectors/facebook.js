var request = require('request');
var logger = require('./../../utils/logger');
var moment = require('moment');
var util = require('util');
var scheduleTo = require('../scheduleTo');
var handleUnexpected = require('../handleUnexpected');
var helpers = require('../../utils/helpers');

var API = 'https://graph.facebook.com';

function connector(state, callback) {
	var accessToken = state.accessToken;
	var log = logger.connector('facebook');

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

		return handleResponse(response, body.data);
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
			state.page = 0;
		}

		if (state.mode === 'rateLimit') {
			state.mode = state.prevMode;
		}
	}

	function formatRequestUri(accessToken, state) {
		var limit = 500;
		var base = util.format('%s/me/likes?access_token=%s&limit=%s&fields=link,name,website,description,id,created_time,picture', API, accessToken, limit);
		return state.mode === 'initial' || state.page ?
			util.format('%s&offset=%s', base, state.page * limit) :
			base;
	}

	function handleResponse(response, body) {
		var rateLimit = 100;
		log.info('rate limit remaining: ' +  rateLimit + ' for user: ' + state.user);

		if (Array.isArray(body)) {
			var stars = body.map(function (r) {
				return {
					itemId: r.id.toString(),
					idInt: r.id,
					user: state.user,
					name: r.name,
					source: r.link,
					avatarUrl: r.picture.data.url,
					created: moment(r.created_time).toDate(),
					date: moment().toDate(),
					description: r.description,
					type: 'facebook'
				};
			});

			log.info('retrieved ' + stars.length + ' likes for user: ' + state.user);

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

module.exports = connector;