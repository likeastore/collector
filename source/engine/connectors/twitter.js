var networks = require('./../../db/networks');
var moment = require('moment');
var logger = require('./../../utils/logger');

module.exports = function (sub, callback) {
	logger.connector('twitter').info('started user: ' + sub.userId);

	sub.lastExecution = moment().format();
	return networks.update(sub, callback);
};