var config = require('../../config');
var db = require('../db')(config);

module.exports = {
	findAll: function (query, callback) {
		return db.networks.find(query, callback);
	},

	find: function (query, callback) {
		return db.networks.findOne(query, callback);
	},

	update: function (obj, callback) {
		return db.networks.findAndModify({
			query: { _id: obj._id },
			update: obj
		}, callback);
	},

	stream: function (query) {
		return db.networks.find(query || {});
	}
};