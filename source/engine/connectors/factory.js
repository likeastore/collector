var networks = require('./../../db/networks');
var items = require('./../../db/items');
var connectors = require('./connectors');
var logger = require('./../../utils/logger');

function executor(connector) {
	return function (state, callback) {
		connector(state, function (err, state, fetched) {
			var connectorErr = err;
			// update state
			networks.update(state, function (err) {
				if (err) {
					logger.error({message: 'update state error', state: state, err: err});
				}
				// update items
				items.update(fetched, function (err, updated) {
					if (err) {
						logger.error({message: 'update items error', err: err});
					}

					return callback(connectorErr, updated);
				});
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