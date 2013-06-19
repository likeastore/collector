var moment = require('moment');
var config = require('../../config');

function executor(state, connectors, callback) {
	var service = state.service;
	var connector = connectors[service];

	connector(state, function (err, state, results) {
		if (err) {
			return callback (err, state);
		}

		state.scheduledTo = scheduleTo(state);
		callback(null, state, results);
	});

	function scheduleTo(state) {
		var currentMoment = moment();
		var scheduleForMode = {
			initial: config.collector.quotes[service].runAfter,
			normal: config.collector.nextNormalRunAfter,
			rateLimit: config.collector.nextRateLimitRunAfter
		};

		var next = scheduleForMode[state.mode];
		if (!next) {
			return callback ({message: 'collector in unexpected state', state: state});
		}

		return currentMoment.add(next, 'milliseconds').toDate();
	}
}

module.exports = executor;