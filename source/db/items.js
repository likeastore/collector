var db = require('./dbConnector').db;

module.exports = {
	update: function (items, callback) {
		db.items.insert(items, function (err) {
			if (err) {
				return callback(err);
			}

			return callback (null);
		});
	}
};