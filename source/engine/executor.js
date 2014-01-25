var util = require('util');
var moment = require('moment');
var items = require('../models/items');
var users = require('../models/users');
var networks = require('../models/networks');
var logger = require('../utils/logger');

// TODO: Thinks about to separate `request` part of collector and `store` part.. first one
// could be easily run in paraller, second in series.

// TODO: function looks complex, need to refactor it
function executor(state, connectors, callback) {
	var service = state.service;
	var connector = connectors[service];

	var connectorStarted = moment();

	connector(state, connectorExecuted);

	function connectorExecuted(err, state, results) {
		if (err) {
			logger.error({message: 'connector execution failed', connector: service, state: state, error: err});
		}


		saveConnectorState(state, connectorStateSaved);

		function saveConnectorState (state, callback) {
			if (state) {
				return networks.update(state, callback);
			}

			callback (null);
		}

		function connectorStateSaved (err) {
			if (err) {
				logger.error({message: 'connector save state failed', connector: service, state: state, error: err});
			}

			if (results) {
				return saveConnectorResults(results, connectorResultsSaved);
			}

			connectorResultsSaved(null, moment.duration(0));
		}

		function saveConnectorResults(results, callback) {
			var saveStarted = moment();
			items.update(results, function (err) {
				var saveExecuted = moment();
				callback(err, moment.duration(saveExecuted.diff(saveStarted)));
			});
		}

		function connectorResultsSaved (err, saveDuration) {
			if (err) {
				logger.error({message: 'connector save items failed', connector: service, state: state, error: err});
			}

			var connectorExecuted = moment();
			var duration = moment.duration(connectorExecuted.diff(connectorStarted));

			logger.important(
				util.format('connector: %s (%s), items: %s, saved: %d sec., executed: %d sec.',
					service,
					state.user,
					results ? results.length : '[NOT COLLECTED]',
					saveDuration.asSeconds().toFixed(2),
					duration.asSeconds().toFixed(2)));

			callback(null);
		}
	}
}

module.exports = executor;