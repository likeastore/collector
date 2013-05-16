var request = require('request');
var logger = require('./../../utils/logger');
var moment = require('moment');
var util = require('util');

var helpers = require('./../../utils/helpers');
var stater = require('./../../utils/stater');

var API = 'https://api.twitter.com/1.1';

function connector(state, callback) {
	var accessToken = state.accessToken;
	var accessTokenSecret = state.accessTokenSecret;
	var username = state.username;
	var log = logger.connector('twitter');

	if (!accessToken) {
		return callback('missing accessToken for user: ' + state.userId);
	}

	if (!accessTokenSecret) {
		return callback('missing accessTokenSecret for user: ' + state.userId);
	}

	if (!username) {
		return callback('missing username for user: ' + state.userId);
	}

	initState(state);

	var uri = formatRequestUri(username, state);
	var headers = { 'Content-Type': 'application/json', 'User-Agent': 'likeastore/collector'};

	var oauth = {
		// TODO: regenerate and put to config
		consumer_key: 'dgwuxgGb07ymueGJF0ug',
		consumer_secret: 'eusoZYiUldYqtI2SwK9MJNbiygCWOp9lQX7i5gnpWU',
		token: accessToken,
		token_secret: accessTokenSecret
	};

	log.info('prepearing request in (' + state.mode + ') mode.');

	request({uri: uri, headers: headers, oauth: oauth, json: true}, function (err, response, body) {
		if (err) {
			return callback('request failed: ' + err);
		}

		return handleResponse(response, body);
	});

	function formatRequestUri(username, state) {
		var base = util.format('%s/favorites/list.json?screen_name=%s&count=200&include_entities=false', API, username);
		return state.maxId ?
			util.format('%s&max_id=%s', base, state.maxId) :
			state.mode === 'normal' ?
				util.format('%s&since_id=%s', base, state.sinceId) :
				base;
	}

	function initState(state) {
		if (!state.mode) {
			state.mode = 'initial';
		}

		if (state.rateLimitExceed) {
			state.rateLimitExceed = false;
		}
	}

	function handleResponse(response, body) {
		var rateLimit = response.headers['x-rate-limit-remaining'];
		log.info('rate limit remaining: ' + rateLimit + ' for user: ' + state.userId);

		if (rateLimit === 0) {
			log.warning('rate limit exceeed for user: ' + state.userId);
			state.rateLimitExceed = true;
		}

		var favorites = body.map(function (fav) {
			return {
				itemId: fav.id_str,
				userId: state.userId,
				date: moment(fav.created_at).format(),
				description: fav.text,
				avatarUrl: fav.user.profile_image_url,
				source: 'http://twitter.com/' + fav.user.screen_name,
				retweets: fav.retweet_count,
				favorites: fav.favorite_count,
				type: 'twitter'
			};
		});

		log.info('retrieved ' + favorites.length + ' favorites');

		return callback(null, updateState(state, favorites), favorites);
	}

	function updateState(state, favorites) {
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
					state.sinceId = data[0].itemId;
				}
			},
			// store sinceId
			{
				condition: function (state, data) {
					return state.mode === 'normal' && data.length > 0;
				},
				apply: function (state, data) {
					state.sinceId = data[0].itemId;
				}
			},
			{
				condition: function (state, data) {
					return state.mode === 'initial' && data.length > 0;
				},
				apply: function (state, data) {
					state.maxId = helpers.decrementStringId(data[data.length - 1].itemId);
				}
			},
			// go to normal
			{
				condition: function (state, data) {
					return state.mode === 'initial' && data.length === 0;
				},
				apply: function (state, data) {
					state.mode = 'normal';
					delete state.maxId;
				}
			}
		];

		return stater.update(state, stateChanges, favorites);
	}
}

module.exports = connector;