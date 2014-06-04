var _ = require('underscore');
var moment = require('moment');

var config = require('../../config');
var db = require('../db')(config);

var userPickFields = ['_id', 'avatar', 'bio', 'displayName', 'email', 'location', 'name', 'username', 'website'];

function findByEmail(email, callback) {
	db.users.findOne({email: email}, function (err, user) {
		if (err) {
			return callback(err);
		}

		callback(null, _.pick(user, userPickFields));
	});
}

function findNonActive(callback) {
	var query = {$or: [ {loginLastDate: {$exists: false}}, {loginLastDate: {$lt: moment().subtract('month', 2).toDate() }}]};
	db.users.find(query, callback);
}

module.exports = {
	findByEmail: findByEmail,
	findNonActive: findNonActive
};