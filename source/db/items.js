var db = require('./dbConnector').db;
var logger = require('./../utils/logger');

module.exports = {
	update: function (items, callback) {
		if (!items) {
			logger.warning({message: 'networks storage, items is undefined'});
			return callback (null);
		}

		if (items.length === 0) {
			return callback (null);
		}

		db.items.insert(items, function (err) {
			if (err) {
				return callback(err);
			}

			return callback (null);
		});
	}
};