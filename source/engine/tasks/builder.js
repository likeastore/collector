var moment = require('moment');
var connectorsFactory = require('./../connectors/factory');
var logger = require('./../../utils/logger');

function checkQuotas(state) {
	if (!state.quotas || !state.lastExecution) {
		return true;
	}

	var requestPerMinute = state.quotas.requests.perMinute;
	var lastExecution = state.lastExecution;
	var period = 60 / requestPerMinute;

	var result = moment().diff(lastExecution, 'seconds') > period;

	if (!result) {
		logger.warning('checkQuotas for service [' + state.service + '] of user ' + state.userId + ' is false.');
	}

	return result;
}

function checkRateLimit(state) {
	if (!state.quotas || !state.lastExecution) {
		return true;
	}

	var exceed = state.rateLimitExceed;
	var repeatAfterMinutes = state.quotas.requests.repeatAfterMinutes;
	var lastExecution = state.lastExecution;
	var period = 60 * repeatAfterMinutes;

	var result = !exceed || moment().diff(lastExecution, 'seconds') > period;

	if (!result) {
		logger.warning('checkRateLimit for service [' + state.service + '] of user ' + state.userId + ' is false.');
	}

	return result;
}

function createTask(state) {
	var connector = connectorsFactory.create(state);

	return connector && function (callback) {
		return connector(state, callback);
	};
}

function create(networks) {
	var tasks = [];
	networks.forEach(function (state) {
		if (!state.skip && checkRateLimit(state) && checkQuotas(state)) {
			var task = createTask(state);
			task && tasks.push(task);
		}
	});

	return tasks;
}

module.exports = {
	create: create
};