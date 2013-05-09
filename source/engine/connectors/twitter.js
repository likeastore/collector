var request = require('request');
var logger = require('./../../utils/logger');
var moment = require('moment');
var util = require('util');

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

		log.info('rate limit remaining: ' + response.headers['x-rate-limit-remaining'] + ' for user: ' + state.userId);

		return handleResponse(response, body);
	});

	function formatRequestUri(username, state) {
		var base = 'https://api.twitter.com/1.1/favorites/list.json?screen_name=' + username + '&count=200';
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
	}

	function handleResponse(response, body) {
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
		state.lastExecution = moment().format();

		if (state.mode === 'initial' && !state.sinceId && favorites.length > 0) {
			state.sinceId = favorites[0].itemId;
		}

		if (state.mode === 'normal' && favorites.length > 0) {
			state.sinceId = favorites[0].itemId;
		}

		if (state.mode === 'initial' && favorites.length > 0) {
			state.maxId = favorites[favorites.length - 1].itemId;
		} else {
			state.mode = 'normal';
			delete state.maxId;
		}

		return state;
	}
}

module.exports = connector;