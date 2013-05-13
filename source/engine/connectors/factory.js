var networks = require('./../../db/networks');
var items = require('./../../db/items');
var connectors = require('./connectors');
var logger = require('./../../utils/logger');

function executor(connector) {
	return function (state, callback) {
		connector(state, function (err, state, fetched) {
			if (err) {
				return callback(err);
			}

			// update state
			networks.update(state, function (err) {
				if (err) {
					return callback(err);
				}

				// update items
				items.update(fetched, callback);
			});
		});
	};
}

function getConnector(state) {
	return connectors[state.service];
}

function create(state) {
	var connector = getConnector(state);

	if (!connector) {
		logger.warning('missing logger for service: ' + state.service);
	}

	return connector && executor(connector);
}

module.exports = {
	create: create
};