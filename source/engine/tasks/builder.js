var moment = require('moment');
var connectorsFactory = require('./../connectors/factory');

function checkQuotas(sub) {
	if (!sub.quotas || !sub.lastExecution) {
		return true;
	}

	var requestPerMinute = sub.quotas.requests.perMinute;
	var lastExecution = sub.lastExecution;

	return moment().diff(lastExecution, 'minutes') > requestPerMinute;
}

function createTask(sub) {
	var connector = connectorsFactory.create(sub);

	return function (callback) {
		return connector(callback);
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