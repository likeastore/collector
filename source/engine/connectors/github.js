var request = require('request');
var logger = require('./../../utils/logger');
var moment = require('moment');
var util = require('util');

var API = 'https://api.github.com';

function connector(state, callback) {
	var accessToken = state.accessToken;
	var username = state.username;
	var log = logger.connector('github');

	if (!accessToken) {
		return callback('missing accessToken for user: ' + state.userId);
	}

	if (!username) {
		return callback('missing username for user: ' + state.userId);
	}

	initState(state);

	log.info('prepearing request in (' + state.mode + ') mode.');

	var uri = formatRequestUri(username, accessToken, state);
	var headers = { 'Content-Type': 'application/json', 'User-Agent': 'likeastore/collector'};

	request({uri: uri, headers: headers}, function (err, response, body) {
		if (err) {
			return callback('request failed: ' + err);
		}

		return handleResponse(response, JSON.parse(body || '[]'));
	});

	function initState(state) {
		if (!state.mode) {
			state.mode = 'initial';
		}

		if (state.mode === 'initial' && !state.page) {
			state.page = 1;
		}
	}

	function formatRequestUri(username, accessToken, state) {
		return state.mode === 'initial' || state.page ?
			util.format('%s/users/%s/starred?access_token=%s&page=%s', API, username, accessToken, state.page) :
			util.format('%s/users/%s/starred?access_token=%s', API, username, accessToken);
	}

	function handleResponse(response, body) {
		var stars = body.map(function (r) {
			return {
				itemId: r.id,
				name: r.full_name,
				authorName: r.owner.login,
				authorUrl: r.owner.html_url,
				authorGravatar: r.owner.gravatar_id,
				avatarUrl: 'http://www.gravatar.com/avatar/' + r.owner.gravatar_id + '?d=mm',
				url: r.html_url,
				date: moment(r.created_at).format(),
				description: r.description,
				type: 'github'
			};
		});

		log.info('retrieved ' + stars.length + ' stars');

		return callback(null, updateState(state, stars.length > 0), stars);
	}

	function updateState(state, fetchedData) {
		state.lastExecution = moment().format();
		if (state.mode === 'initial' && fetchedData) {
			state.page += 1;
		} else {
			state.mode = 'normal';
			delete state.page;
		}

		return state;
	}
}

module.exports = connector;