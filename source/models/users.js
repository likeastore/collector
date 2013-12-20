var config = require('../../config');
var db = require('../db')(config);

module.exports = {
	notifyOnError: function (user, message, callback) {
		db.users.findAndModify({user: user}, [], {$set: {warning: true}}, {}, callback);
	}
};