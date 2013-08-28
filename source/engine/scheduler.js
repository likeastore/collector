var util = require('util');
var moment = require('moment');
var async = require('async');
var executor = require('./executor');
var items = require('../db/items');
var networks = require('../db/networks');
var logger = require('../utils/logger');
var config = require('../../config');
var connectors = require('./connectors');

function allowedToExecute (state) {
	if (state.skip || state.disabled) {
		return false;
	}

	if (!state.scheduledTo) {
		return true;
	}

	return moment().diff(state.scheduledTo) > 0;
}

function task(state) {
	return function (callback) { return executor (state, connectors, callback); };
}

function createTasks(mode, states) {
	var tasks = states.map(function (state) {
		return allowedToExecute(state) ? task(state) : null;
	}).filter(function (task) {
		return task !== null;
	});

	return tasks;
}

function runAllTasks(tasks, callback) {
	logger.info('currently allowed to run: ' + tasks.length);
	async.series(tasks, callback);
}

function createQuery(mode) {
	var queries = {
		initial: {
			$or: [ {mode: {$exists: false }}, { mode: 'initial'}, {mode: 'rateLimit'}]
		},

		normal: {
			mode: 'normal'
		}
	};

	return queries[mode];

}

module.exports = function (mode) {
//	var timeout;

	function schedulerLoop() {
		var query = createQuery(mode);
		networks.findAll(query, function (err, states) {
			if (err && !states) {
				return schedulerCallback({message: 'failed to read network states', err: err});
			}

			var tasks = createTasks(mode, states);
			var started = moment();

			runAllTasks(tasks, function (err) {
				var finished = moment();
				var duration = moment.duration(finished.diff(started));

				schedulerCallback(err, duration);
			});
		});
	}

	function schedulerCallback(err, duration) {
		if (err) {
			logger.error(err);
		}

		logger.info(util.format('collection cycle: %d sec. (%d mins.)', duration.asSeconds().toFixed(2), duration.asMinutes().toFixed(2)));
		restartScheduler();
	}

	function restartScheduler () {
		// http://stackoverflow.com/questions/16072699/nodejs-settimeout-memory-leak
		// http://stackoverflow.com/questions/9699069/how-to-prevent-memory-leak-in-javascript

		// if (timeout) {
		// 	clearTimeout(timeout);
		// }

		var timeout = setTimeout(schedulerLoop, config.collector.schedulerRestart);
	}

	return {
		run: function () {
			schedulerLoop();
		}
	};
};