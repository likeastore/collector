var networks = require('./../../db/networks');
var moment = require('moment');
var logger = require('./../../utils/logger');
var github = require('octonode');

var connnector = {
	request: function (sub, callback) {
		logger.connnector('github').info('prepearing request for API...');

		var accessToken = sub.accessToken;
		var username = sub.username;

		if (!accessToken) {
			return callback('missing accessToken for user: ' + sub.userId);
		}

		if (!username) {
			return callback('missing username for user: ' + sub.userId);
		}

		return callback(null, []);
	},

	updateLastExecution: function (sub, callback) {
		logger.connnector('github').info('updating lastExecution attribute for network...');

		sub.lastExecution = moment().format();
		return networks.update(sub, callback);
	},

	updateItems: function(stars, callback) {
		logger.connnector('github').info('updating items collection...');

		return callback(null, []);
	},

	start: function (sub, callback) {
		logger.connnector('github').info('started user: ' + sub.userId);

		this.request(sub, updateLastExecution);

		function updateLastExecution(err, stars) {
			if (err) {
				return callback(err);
			}

			this.updateLastExecution(sub, function(err) {
				return updateItems(err, stars);
			});
		}

		function updateItems(err, stars) {
			if (err) {
				return callback(err);
			}

			this.updateItems(stars, callback);
		}
	}
};


module.exports = function (sub, callback) {
	connnector.start(sub, callback);
};