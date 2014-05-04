var _ = require('underscore');
var async = require('async');
var moment = require('moment');

var config = require('../../config');
var db = require('../db')(config);
var elastic = require('../elastic')(config);

module.exports = {
	findNew: function (items, state, callback) {
		if (!items || items.length === 0) {
			return callback(null, items);
		}

		// apply check for all modes (there is a trouble in tubmblr connector)
		// if (state.mode === 'initial') {
		// 	return callback(null, items);
		// }

		var check = function (item, callback) {
			db.items.findOne({user: state.user, itemId: item.itemId}, function(err, found) {
				callback(!found);
			});
		};

		async.filter(items, check, function (detected) {
			callback(null, detected);
		});
	},

	insert: function (items, state, callback) {
		if (!items || items.length === 0) {
			return callback(null, items);
		}

		items = items.map(function (item) {
			return _.extend(item, {date: moment().toDate()});
		});

		db.items.insert(items, callback);
	},

	index: function (items, state, callback) {
		if (!items || items.length === 0) {
			return callback(null, items);
		}

		var commands = [];
		items.forEach(function (item) {
			commands.push({'index': {'_index': 'items', '_type': 'item', '_id': item._id.toString()}});
			commands.push(item);
		});

		elastic.bulk({body: commands}, callback);
	}
};