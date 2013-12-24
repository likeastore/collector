var _ = require('underscore');
var config = require('../../config');
var db = require('../db')(config);

var usersCache = {};

module.exports = {
	findAndCache: function (email, callback) {
		if (usersCache[email]) {
			return callback (null, usersCache[email]);
		}

		db.users.findOne({email: email}, function (err, user) {
			if (err) {
				return callback(err);
			}

			usersCache[email] = _.pick(user, ['avatar', 'displayName', 'email', 'name' ]);

			return callback (null, usersCache[email]);
		});
	}
};