var moment = require('moment');
var connectorsFactory = require('./../connectors/factory');
var logger = require('./../../utils/logger');

function checkQuotas(sub) {
	if (!sub.quotas || !sub.lastExecution) {
		return true;
	}

	var requestPerMinute = sub.quotas.requests.perMinute;
	var lastExecution = sub.lastExecution;
	var period = 60 / requestPerMinute;

	return moment().diff(lastExecution, 'seconds') > period;
}

function createTask(sub) {
	var connector = connectorsFactory.create(sub);

	return connector && function (callback) {
		return connector(sub, callback);
	};
}

function create(subscriptions) {
	var tasks = [];
	subscriptions.forEach(function (s) {
		if (!s.skip && checkQuotas(s)) {
			var task = createTask(s);
			task && tasks.push(task);
		}
	});

	return tasks;
}

module.exports = {
	create: create
};