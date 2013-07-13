var db = require('./dbConnector').db;
var logger = require('./../utils/logger');
var async = require('async');

module.exports = {
	update: function (items, callback) {
		if (!items) {
			logger.warning({message: 'networks storage, items is undefined'});
			return callback (null);
		}

		var updates = items.map(function (item) {
			return function (callback) {
				db.items.update({itemId: item.itemId}, item, {upsert: true}, callback);
			};
		});

		async.series(updates, callback);
	}
};