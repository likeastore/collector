var config = require('../../config');
var db = require('../db')(config);
var async = require('async');

module.exports = {
	update: function (items, callback) {
		// TODO: FIXME - do bulk update here
		var updates = items.map(function (item) {
			return function (callback) {
				db.items.update({itemId: item.itemId, user: item.user}, item, {upsert: true, safe: true}, callback);
			};
		});

		async.series(updates, callback);
	}
};