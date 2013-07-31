var moment = require('moment');
var config = require('../../config');
var items = require('../db/items');
var networks = require('../db/networks');
var logger = require('../utils/logger');
var connectors = require('./connectors');

function runner(state, callback) {
	connectors.connect(state, connectorExecuted);

	function connectorExecuted(err, state, results) {
		if (err) {
			logger.error({message: 'connector execution failed', state: state, error: err});
		}

		saveConnectorState(state, connectorStateSaved);

		function connectorStateSaved (err) {
			if (err) {
				logger.error({message: 'connector save state failed', state: state, error: err});
			}

			saveConnectorResults(results, connectorResultsSaved);
		}

		function connectorResultsSaved (err) {
			if (err) {
				logger.error({message: 'connector save items failed', state: state, error: err});
			}

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

module.exports = runner;