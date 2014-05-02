var _ = require('underscore');
var moment = require('moment');

var config = require('../../config');
var db = require('../db')(config);
var elastic = require('../elastic')(config);

module.exports = {
	detectNew: function (user, items, state, callback) {
		if (!items) {
			return callback(null, items);
		}

		if (state.mode === 'initial') {
			return callback(null, items);
		}

		db.items.find({user: user.email, type: state.service}).limit(items.length).sort({_id: 1}, function (err, found) {
			if (err) {
				return callback(err);
			}

			var foundItemsIds = found.map(function (i) {
				return i.itemId;
			});

			var newItemsIds = items.map(function (i) {
				return i.itemId;
			});

			var itemsIdsToInsert = _.difference(foundItemsIds, newItemsIds);

			var itemsToInsert = itemsIdsToInsert.map(function (id) {
				return _.find(items, function (item) {
					return item.itemId === id;
				});
			});

			callback(null, itemsToInsert);
		});
	},

	insert: function (items, state, callback) {
		if (!items) {
			return callback(null);
		}

		items = items.map(function (item) {
			return _.extend(item, {date: moment().toDate()});
		});

		db.items.insert(items, callback);
	},

	index: function (items, state, callback) {
		var commands = [];
		items.forEach(function (item) {
			commands.push({'index': {'_index': 'items', '_type': 'item', '_id': item._id.toString()}});
			commands.push(item);
		});

		elastic.bulk(commands, callback);
	}
};