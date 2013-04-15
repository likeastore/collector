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

		var client = github.client(accessToken);
		client.get('/users/' + username + '/starred', function (err, responseCode, responseBody) {
			logger.connnector('github').info('retrieved ' + responseBody.length + ' starred repos');

			if (responseCode !== 200) {
				return callback('request failed with status: ' + responseCode);
			}

			var stars = responseBody.map(function (r) {
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

			return callback(null, stars);
		});
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

		var me = this;
		function updateLastExecution(err, info) {
			if (err) {
				return callback(err);
			}

			me.updateLastExecution(info, function(err) {
				return updateItems(err, info);
			});
		}

		function updateItems(err, info) {
			if (err) {
				return callback(err);
			}

			me.updateItems(info, callback);
		}
	}
};


module.exports = function (sub, callback) {
	connnector.start(sub, callback);
};