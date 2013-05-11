var db = require('./dbConnector').db;

module.exports = {
	update: function (items, callback) {
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