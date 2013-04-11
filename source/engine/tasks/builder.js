var moment = require('moment');
var connectorsFactory = require('./../connectors/factory');

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

	return function (callback) {
		return connector(sub, callback);
	};
}

function create(subscriptions) {
	var tasks = [];
	subscriptions.forEach(function (s) {
		checkQuotas(s) && tasks.push(createTask(s));
	});

	return tasks;
}

module.exports = {
	create: create
};