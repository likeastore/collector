var moment = require('moment');
var util = require('util');

var networks = require('../models/networks');
var logger = require('../utils/logger');

function disableNetworks(state, callback) {
	var userData = state.userData;

	if (userData && (!userData.loginLastDate || moment().diff(userData.loginLastDate, 'months') > 1)) {
		logger.important(util.format('disable network: %s, user: %s', state.service, state.user));

		return networks.disable(state, callback);
	}

	callback(null);
}

module.exports = disableNetworks;