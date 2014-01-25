var networks = require('../models/networks');

function disableNetworks(state, callback) {
	return networks.disable(state, callback);
}

module.exports = disableNetworks;