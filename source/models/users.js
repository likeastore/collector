var _ = require('underscore');
var moment = require('moment');

var config = require('../../config');
var db = require('../db')(config);

var usersCache = {};

function findAndCache(email, callback) {
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

function findNonActive(callback) {
	var query = {$or: [ {loginLastDate: {$exists: false}}, {loginLastDate: {$lt: moment().subtract('month', 2).toDate() }}]};
	db.users.find(query, callback);
}

module.exports = {
	findAndCache: findAndCache,
	findNonActive: findNonActive
};