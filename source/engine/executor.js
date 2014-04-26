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
		saveResults,
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
		connector(state, user, function (err, state, results) {
			callback(err, results, user);
		});
	}

	function saveResults(results, user, callback) {
		items.insert(results, state, function(err) {
			callback(err, user, results);
		});
	}

	function saveState(user, results, callback) {
		networks.update(state, user, function (err) {
			callback(err, results);
		});
	}
}

module.exports = executor;