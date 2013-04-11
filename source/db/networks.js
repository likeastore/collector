var db = require('./dbConnector').db;

module.exports = {
	all: function (callback) {
		db.networks.find({}, callback);
	}
};