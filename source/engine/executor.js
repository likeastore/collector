var util = require('util');
var async = require('async');
var moment = require('moment');
var items = require('../models/items');
var users = require('../models/users');
var networks = require('../models/networks');
var logger = require('../utils/logger');

function executor(state, connectors, callback) {
	var executorStarted = moment();

	async.waterfall([
		readUser,
		executeConnector,
		detectNewItems,
		saveToMongo,
		saveToEleastic,
		saveState
	], function (err, results) {
		var executorFinished = moment();
		var duration = moment.duration(executorFinished.diff(executorStarted));

		logger.important(
			util.format('connector: %s (%s), items: %s, executed: %d sec.',
				state.service,
				state.user,
				results ? results.length : '[NOT COLLECTED]',
				duration.asSeconds().toFixed(2)));

		callback(err);
	});

	function readUser(callback) {
		users.findByEmail(state.user, function(err, user) {
			callback(err, user);
		});
	}

	function executeConnector(user, callback) {
		var connector = connectors[state.service];
		connector(state, user, function (err, state, collected) {
			callback(err, user, collected);
		});
	}

	function detectNewItems(user, collected, callback) {
		items.detectNew(user, state, collected, function (err, detected) {
			callback(err, user, detected);
		});
	}

	function saveToMongo(user, detected, callback) {
		items.insert(detected, state, function(err, saved) {
			callback(err, user, saved);
		});
	}

	function saveToEleastic(user, saved) {
		items.index(saved, state, function (err) {
			callback(null, user, saved);
		});
	}

	function saveState(user, saved, callback) {
		networks.update(state, user, function (err) {
			callback(err, saved);
		});
	}
}

module.exports = executor;