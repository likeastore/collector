var async = require('async');
var moment = require('moment');

var config = require('../../config');
var db = require('../db')(config);

module.exports = {
	insert: function (items, state, callback) {
		items = items || [];

		var updates = items.map(function (item) {
			return function (callback) {
				db.items.update({
					itemId: item.itemId,
					user: item.user
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

		async.series(updates, callback);
	}
};