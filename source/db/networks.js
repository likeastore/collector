var db = require('./dbConnector').db;

module.exports = {
	findAll: function (callback) {
		return db.networks.find({}, callback);
	},

	find: function (query, callback) {
		return db.networks.findOne(query, callback);
	},

	update: function (obj, callback) {
		return db.networks.findAndModify({
			query: { _id: obj._id },
			update: obj
		}, callback);
	}
};