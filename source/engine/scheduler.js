var util = require('util');
var moment = require('moment');
var async = require('async');

var executor = require('./executor');
var disableNetworks = require('./disableNetworks');
var networks = require('../models/networks');
var logger = require('../utils/logger');
var config = require('../../config');
var connectors = require('./connectors');

function scheduler (mode) {

	function schedulerLoop() {
		var collectorSteps = [runCollectingTasks, runCleaningTasks];
		async.series(collectorSteps, restartScheduler);
	}

	function restartScheduler (err, results) {
		if (err) {
			logger.error(err);
		}

		var totalTasks = results.reduce(function (memo, value) {
			return memo + value;
		});

		// http://stackoverflow.com/questions/16072699/nodejs-settimeout-memory-leak
		var timeout = setTimeout(schedulerLoop, totalTasks > 0 ? config.collector.schedulerRestartShort : config.collector.schedulerRestartLong);
	}

	function runCollectingTasks(callback) {
		prepareCollectingTasks(function (err, tasks) {
			if (err) {
				return callback(err);
			}

			runTasks(tasks, 'collecting', callback);
		});
	}

	function runCleaningTasks(callback) {
		prepareCleaningTasks(function (err, tasks) {
			if (err) {
				return callback(err);
			}

			runTasks(tasks, 'cleaning', callback);
		});
	}

	function prepareCollectingTasks(callback) {
		networks.findByMode(mode, function (err, states) {
			if (err) {
				return callback({message: 'error during networks query', err: err});
			}

			if (!states) {
				return callback({message: 'failed to read networks states'});
			}

			callback(null, createCollectingTasks(states));
		});
	}

	function prepareCleaningTasks(callback) {
		networks.findByMode(mode, function (err, states) {
			if (err) {
				return callback({message: 'error during networks query', err: err});
			}

			if (!states) {
				return callback({message: 'failed to read networks states'});
			}

			callback(null, createCleaningTasks(states));
		});
	}

	function runTasks(tasks, type, callback) {
		tasks.length > 0 && logger.important(util.format('%s currently allowed to run: %s', type, tasks.length));

		var started = moment();
		async.series(tasks, function (err) {
			if (err) {
				// report error but continue execution to do not break execution chain..
				logger.error(err);
			}

			var finished = moment();
			var duration = moment.duration(finished.diff(started));

			logger.important(util.format('%s tasks processed: %s, duration: %d sec. (%d mins.)', type, tasks.length, duration.asSeconds().toFixed(2), duration.asMinutes().toFixed(2)));

			callback(null, tasks.length);
		});
	}

	function createCollectingTasks(states) {
		var tasks = states.map(function (state) {
			return allowedToExecute(state) ? collectingTask(state) : null;
		}).filter(function (task) {
			return task !== null;
		});

		return tasks;
	}

	function createCleaningTasks(states) {
		var tasks = states.map(function (state) {
			return allowToDisable(state) ? disableNetworksTask(state) : null;
		}).filter(function (task) {
			return task !== null;
		});

		return tasks;
	}

	function allowedToExecute (state) {
		if (state.skip || state.disabled) {
			return false;
		}

		if (!state.scheduledTo) {
			return true;
		}

		return moment().diff(state.scheduledTo) > 0;
	}

	function allowToDisable (state) {
		if (state.disabled || state.skip || !state.userData) {
			return false;
		}

		return !state.userData.loginLastDate || moment().diff(state.userData.loginLastDate, 'months') > 1;
	}

	function collectingTask(state) {
		return function (callback) { return executor(state, connectors, callback); };
	}

	function disableNetworksTask(state) {
		return function (callback) { return disableNetworks(state, callback); };
	}

	return {
		run: function () {
			schedulerLoop();
		}
	};
}

module.exports = scheduler;