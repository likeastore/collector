var networks = require('./../../db/networks');
var moment = require('moment');

module.exports = function (sub, callback) {
	console.log('CONNECTOR: twitter task started for user: ' + sub.userId);

	sub.lastExecution = moment().format();
	return networks.update(sub, callback);
};