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
		findNew,
		saveToMongo,
		//saveToEleastic,
		saveState
	], function (err, results) {
		var executorFinished = moment();
		var duration = moment.duration(executorFinished.diff(executorStarted));

		logger.important(
			util.format('connector: %s (%s), items: %s, executed: %d sec.',
				state.service,
				state.user,
				formatLength(results),
				duration.asSeconds().toFixed(2)));

		callback(err);
	});

	function readUser(next) {
		logger.info('[executor]: reading user info');

		users.findByEmail(state.user, function(err, user) {
			next(logErrorAndProceed(err, '[executor]: failed to find user'), user);
		});
	}

	function executeConnector(user, next) {
		logger.info('[executor]: executing connector for (' + state.user + ') service: ' + state.service);

		var connector = connectors[state.service];
		connector(state, user, function (err, state, collected) {
			next(logErrorAndProceed(err, '[executor]: failed to execute connector'), user, collected);
		});
	}

	function findNew(user, collected, next) {
		logger.info('[executor]: finding new (' + state.user + ') collected: ' + formatLength(collected));

		items.findNew(collected, state, function (err, detected) {
			next(logErrorAndProceed(err, '[executor]: failed to find new items'), user, detected);
		});
	}

	function saveToMongo(user, detected, next) {
		logger.info('[executor]: saving to mongo (' + state.user + ') detected: ' + formatLength(detected));

		items.insert(detected, state, function(err, saved) {
			next(logErrorAndProceed(err, '[executor]: failed to save items'), user, saved);
		});
	}

	function saveToEleastic(user, saved, next) {
		logger.info('[executor]: saving to elastic (' + state.user + ') saved: ' + formatLength(saved));

		items.index(saved, state, function (err) {
			next(logErrorAndProceed(err, '[executor]: failed to index items'), user, saved);
		});
	}

	function saveState(user, saved, next) {
		logger.info('[executor]: saving state (' + state.user + ')');

		networks.update(state, user, function (err) {
			next(logErrorAndProceed(err, '[executor]: failed to save state'), saved);
		});
	}

	function logErrorAndProceed(err, message) {
		if (err) {
			logger.error({message: message, err: err});
		}
	}

	function formatLength(items) {
		return items ? items.length : '[NOT COLLECTED]';
	}
}

module.exports = executor;