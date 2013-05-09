var request = require('request');
var logger = require('./../../utils/logger');
var moment = require('moment');
var util = require('util');

function connector(state, callback) {
	var accessToken = state.accessToken;
	var username = state.username;
	var log = logger.connector('twitter');

	if (!accessToken) {
		return callback('missing accessToken for user: ' + state.userId);
	}

	if (!username) {
		return callback('missing username for user: ' + state.userId);
	}

}

module.exports = connector;