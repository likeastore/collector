var moment = require('moment');
var config = require('../../config');

function scheduleTo(state) {
	var currentMoment = moment();
	var service = state.service;

	var scheduleForMode = {
		initial: config.collector.quotes[service].runAfter,
		normal: config.collector.nextNormalRunAfter,
		rateLimit: config.collector.nextRateLimitRunAfter
	};

	var next = scheduleForMode[state.mode];
	var scheduledTo = currentMoment.add(next, 'milliseconds');

	state.scheduledTo = scheduledTo.toDate();

	return state;
}

module.exports = scheduleTo;
