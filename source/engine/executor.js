var util = require('util');
var moment = require('moment');
var items = require('../models/items');
var networks = require('../models/networks');
var logger = require('../utils/logger');

// TODO: Thinks about to separate `request` part of collector and `store` part.. first one
// could be easily run in paraller, second in series. Would it be any profit? I don't know

// TODO: function looks complex, need to refactor it
function executor(state, connectors, callback) {
	var service = state.service;
	var connector = connectors[service];

	var started = moment();

	connector(state, connectorExecuted);

	function connectorExecuted(err, state, results) {
		if (err) {
			logger.error({message: 'connector execution failed', connector: service, state: state, error: err});
		}

		saveConnectorState(state, connectorStateSaved);

		function connectorStateSaved (err) {
			if (err) {
				logger.error({message: 'connector save state failed', connector: service, state: state, error: err});
			}

			saveConnectorResults(results, connectorResultsSaved);
		}

		function connectorResultsSaved (err) {
			if (err) {
				logger.error({message: 'connector save items failed', connector: service, state: state, error: err});
			}

			var finished = moment();
			var duration = moment.duration(finished.diff(started));

			logger.important(
				util.format('connector: %s, items: %s, executed: %d sec. (%d mins.)',
					service,
					results ? results.length : '[NOT COLLECTED]',
					duration.asSeconds().toFixed(2),
					duration.asMinutes().toFixed(2)));

			callback(null);
		}

		function saveConnectorState (state, callback) {
			if (state) {
				return networks.update(state, callback);
			}

			callback (null);
		}

		function saveConnectorResults(results, callback) {
			if (results) {
				return items.update(results, callback);
			}

			callback (null);
		}
	}
}

module.exports = executor;