var db = require('./dbConnector').db;
var logger = require('./../utils/logger');
var async = require('async');

module.exports = {
	notifyOnError: function (user, message, callback) {
		db.users.findAndModify({user: user}, [], {$set: {message: message}}, {}, callback);
	}
};