var request = require('request');
var moment = require('moment');
var util = require('util');

var scheduleTo = require('../scheduleTo');
var logger = require('./../../utils/logger');
var handleUnexpected = require('../handleUnexpected');
var config = require('../../../config');

var API = 'http://api.dribbble.com';

function connector(state, callback) {
	var log = logger.connector('dribbble');
	var username = state.username;

	if (!username) {
		return callback('missing username for user: ' + state.user);
	}

	initState(state);

	log.info('prepearing request in (' + state.mode + ') mode for user: ' + state.user);

	var uri = formatRequestUri(username, state);
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

	function formatRequestUri(username, state) {
		var base = util.format('%s/players/%s/shots/likes?per_page=30', API, username);
		return state.mode === 'initial' && state.page ?
			util.format('%s&page=%s', base, state.page) :
			base;
	}

	function handleResponse(response, body) {
		var shots = body.shots;

		if (!Array.isArray(shots)) {
			return handleUnexpected(response, body, state, function (err) {
				callback(err, scheduleTo(updateState(body, state, [], 9999, true)));
			});
		}

		var likes = shots.map(function (r) {
			return {
				itemId: r.id.toString(),
				idInt: r.id,
				user: state.user,
				created: moment(r.created_at).toDate(),
				title: r.title,
				authorName: r.player.name,
				authorUrl: r.player.url,
				avatarUrl: r.player.avatar_url,
				source: r.url,
				thumbnail: r.image_400_url,
				type: 'dribbble'
			};
		});

		log.info('retrieved ' + likes.length + ' likes for user: ' + state.user);

		return callback(null, scheduleTo(updateState(body, state, likes, 9999, false)), likes);
	}

	function updateState(body, state, data, rateLimit, failed) {
		state.lastExecution = moment().toDate();

		if (!failed) {
			if (state.mode === 'initial' && +body.page < body.total) {
				state.page += 1;
			}

			if (state.mode === 'initial' && +body.page < body.total) {
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