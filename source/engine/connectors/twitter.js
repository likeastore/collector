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

	var url = 'https://api.twitter.com/1.1/favorites/list.json?screen_name=' + username + '&count=200';

	var oauth = {
		consumer_key: 'dgwuxgGb07ymueGJF0ug',
		consumer_secret: 'eusoZYiUldYqtI2SwK9MJNbiygCWOp9lQX7i5gnpWU',
		token: accessToken,
		token_secret: accessTokenSecret
	};

	log.info('prepearing request in (' + state.mode + ') mode.');

	request({url: url, oauth: oauth, json: true}, function (err, response, body) {
		if (err) {
			return callback('request failed: ' + err);
		}

		log.info('rate limit remaining: ' + response.headers['x-rate-limit-remaining'] + ' for user: ' + state.userId);

		return handleResponse(response, JSON.parse(body || '[]'));
	});

	function handleResponse(response, body) {

	}
}

module.exports = connector;