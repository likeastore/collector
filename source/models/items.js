var async = require('async');
var moment = require('moment');

var config = require('../../config');
var db = require('../db')(config);

module.exports = {
	update: function (items, callback) {
		var updates = items.map(function (item) {
			return function (callback) {
				db.items.update({
					itemId: item.itemId,
					user: item.user,
					type: item.type
				}, {
					$set: item,
					$setOnInsert: {
						date: moment().toDate()
					},
				}, {
					upsert: true
				}, callback);
			};
		});

		async.parallelLimit(updates, 16, callback);
	}
};