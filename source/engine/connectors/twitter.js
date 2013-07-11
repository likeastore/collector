var request = require('request');
var logger = require('./../../utils/logger');
var config = require('../../../config');
var moment = require('moment');
var scheduleTo = require('../scheduleTo');
var util = require('util');

var helpers = require('./../../utils/helpers');

var API = 'https://api.twitter.com/1.1';

function connector(state, callback) {
	var accessToken = state.accessToken;
	var accessTokenSecret = state.accessTokenSecret;
	var log = logger.connector('twitter');

	if (!accessToken) {
		return callback('missing accessToken for user: ' + state.userId);
	}

	if (!accessTokenSecret) {
		return callback('missing accessTokenSecret for user: ' + state.userId);
	}

	initState(state);

	var uri = formatRequestUri(state);
	var headers = { 'Content-Type': 'application/json', 'User-Agent': 'likeastore/collector'};

	var oauth = {
		consumer_key: config.services.twitter.consumerKey,
		consumer_secret: config.services.twitter.consumerSecret,
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

	function formatRequestUri(state) {
		var base = util.format('%s/favorites/list.json?count=200&include_entities=false', API);
		return state.maxId ?
			util.format('%s&max_id=%s', base, state.maxId) :
			state.mode === 'normal' && state.sinceId ?
				util.format('%s&since_id=%s', base, state.sinceId) :
				base;
	}

	function initState(state) {
		if (!state.mode) {
			state.mode = 'initial';
		}

		if (state.mode === 'rateLimit') {
			state.mode = state.prevMode;
		}
	}

	function handleResponse(response, body) {
		var rateLimit = +response.headers['x-rate-limit-remaining'];
		log.info('rate limit remaining: ' + rateLimit + ' for user: ' + state.userId);

		if (Array.isArray(body)) {
			var favorites = body.map(function (fav) {
				return {
					itemId: fav.id_str,
					userId: state.userId,
					date: moment(fav.created_at).format(),
					description: fav.text,
					avatarUrl: fav.user.profile_image_url,
					authorName: fav.user.screen_name,
					source: util.format('%s/%s/status/%s', 'https://twitter.com', fav.user.screen_name, fav.id_str),
					retweets: fav.retweet_count,
					favorites: fav.favorite_count,
					type: 'twitter'
				};
			});

			log.info('retrieved ' + favorites.length + ' favorites');

			return callback(null, scheduleTo(updateState(state, favorites, rateLimit)), favorites);
		}

		return callback({message: 'unexpected response', body: body}, scheduleTo(updateState(state, [], rateLimit)));
	}

	function updateState(state, data, rateLimit) {
		if (state.mode === 'initial' && data.length > 0 && !state.sinceId) {
			state.sinceId = data[0].itemId;
		}

		if (state.mode === 'normal' && data.length > 0) {
			state.sinceId = data[0].itemId;
		}

		if (state.mode === 'initial' && data.length > 0) {
			state.maxId = helpers.decrementStringId(data[data.length - 1].itemId);
		}

		if (state.mode === 'initial' && data.length === 0) {
			state.mode = 'normal';
			delete state.maxId;
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