var networks = require('./../../db/networks');
var moment = require('moment');

module.exports = function (sub, callback) {
	console.log('github connector task started user: ' + sub.userId);

	sub.lastExecution = moment().format();
	return networks.update(sub, callback);
};