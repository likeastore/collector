var request = require('request');
var logger = require('./../../utils/logger');
var moment = require('moment');
var util = require('util');

var helpers = require('./../../utils/helpers');
var stater = require('./../../utils/stater');

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

		return handleResponse(response, body);
	});

	function initState(state) {
		if (!state.mode) {
			state.mode = 'initial';
		}

		if (state.mode === 'initial' && !state.page) {
			state.page = 1;
		}

		if (state.rateLimitExceed) {
			delete state.rateLimitExceed;
		}
	}

	function formatRequestUri(username, accessToken, state) {
		var base = util.format('%s/users/%s/starred?access_token=%s&per_page=100', API, username, accessToken);
		return state.mode === 'initial' || state.page ?
			util.format('%s&page=%s', base, state.page) :
			base;
	}

	function handleResponse(response, body) {
		var rateLimit = +response.headers['x-ratelimit-remaining'];
		log.info('rate limit remaining: ' +  rateLimit + ' for user: ' + state.userId);

		if (rateLimit === 0 || isNaN(rateLimit)) {
			state.rateLimitExceed = true;
			log.warning({message: 'rate limit exceeed', state: state});
		}

		if (!Array.isArray(body)) {
			return callback({ message: 'Unexpected response type', body: body});
		}

		state.lastestResponse = body;

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

		return callback(null, updateState(state, stars), newStars);
	}

	function filterNewStars (stars) {
		if (state.mode === 'initial') {
			return stars;
		}

		return helpers.takeWhile(stars, function (star) {
			return +state.sinceId < star.idInt;
		});
	}

	function updateState(state, stars) {
		var stateChanges = [
			// last execution
			{
				condition: function (state, data) {
					return true;
				},
				apply: function (state, data) {
					state.lastExecution = moment().format();
				}
			},
			// intialize sinceId
			{
				condition: function (state, data) {
					return state.mode === 'initial' && data.length > 0 && !state.sinceId;
				},
				apply: function (state, data) {
					state.sinceId = data[0].idInt;
				}
			},
			// increment page
			{
				condition: function (state, data) {
					return state.mode === 'initial' && data.length > 0;
				},
				apply: function (state, data) {
					state.page = state.page + 1;
				}
			},
			// initialize sinceId in normal mode
			{
				condition: function (state, data) {
					return state.mode === 'normal' && data.length > 0;
				},
				apply: function (state, data) {
					state.sinceId = data[0].idInt;
				}
			},
			// go to normal
			{
				condition: function (state, data) {
					return state.mode === 'initial' && data.length === 0;
				},
				apply: function (state, data) {
					state.mode = 'normal';
					delete state.page;
				}
			}
		];

		return stater.update(state, stateChanges, stars);
	}
}

module.exports = connector;