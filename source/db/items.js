var db = require('./dbConnector').db;

module.exports = {
	update: function (items, callback) {
		items.forEach(function (item) {
			db.items.update({itemId: item.itemId, type: item.type}, item, {upsert: true}, function(err) {
				if (err) {
					return callback(err);
				}
			});
		});

		return callback(null);
	}
};