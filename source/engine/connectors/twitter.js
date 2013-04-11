var networks = require('./../../db/networks');
var moment = require('moment');

module.exports = function (sub, callback) {
	console.log('twitter connector task started for user: ' + sub.userId);

	sub.lastExecution = moment().format();
	return networks.update(sub, callback);
};