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

	request({uri: uri, headers: headers, json: true}, function (err, response, body) {
		if (err) {
			return callback('request failed: ' + err);
		}

		log.info('rate limit remaining: ' + response.headers['x-ratelimit-remaining'] + ' for user: ' + state.userId);

		return handleResponse(response, body);
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
		var base = util.format('%s/users/%s/starred?access_token=%s&per_page=100', API, username, accessToken);
		return state.mode === 'initial' || state.page ?
			util.format('%s&page=%s', base, state.page) :
			base;
	}

	function handleResponse(response, body) {
		var stars = select(body.map(function (r) {
			return {
				itemId: r.id.toString(),
				userId: state.userId,
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
		}));

		log.info('retrieved ' + stars.length + ' stars');

		return callback(null, updateState(state, stars), stars);
	}

	function updateState(state, stars) {
		state.lastExecution = moment().format();

		var fetchedData = stars.length > 0;
		if (state.mode === 'initial' && fetchedData && !state.sinceId) {
			state.sinceId = stars[0].itemId;
		}

		if (state.mode === 'initial' && fetchedData) {
			state.page += 1;
		} else {
			state.mode = 'normal';
			delete state.page;
		}

		return state;
	}

	function select (stars) {
		if (stars.mode === 'initial') {
			return stars;
		}

		return takeBefore(state.sinceId);

		function takeBefore(id) {
			var taken = [];
			for(var i = 0, length = stars.length; i < length; i++) {
				if (stars[i].itemId === id) {
					break;
				}

				taken.push(stars[i]);
			}

			return taken;
		}
	}
}

module.exports = connector;