var networks = require('./../../db/networks');
var items = require('./../../db/items');
var connectors = require('./connectors');

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
	return executor(getConnector(state));
}

module.exports = {
	create: create
};