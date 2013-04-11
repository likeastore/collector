var db = require('./dbConnector').db;

module.exports = {
	all: function (callback) {
		return db.networks.find({}, callback);
	},

	update: function (obj, callback) {
		return db.networks.findAndModify({
			query: { _id: obj._id },
			update: obj
		}, callback);
	}
};