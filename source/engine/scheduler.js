var util = require('util');
var moment = require('moment');
var async = require('async');

var executor = require('./executor');
var disableNetworks = require('./disableNetworks');
var networks = require('../models/networks');
var users = require('../models/users');
var logger = require('../utils/logger');
var config = require('../../config');
var connectors = require('./connectors');

function scheduler (mode) {

	function schedulerLoop() {
		var collectorSteps = [runCollectingTasks, runCleaningTasks];

		async.series(collectorSteps, restartScheduler);
	}

	function restartScheduler () {
		// http://stackoverflow.com/questions/16072699/nodejs-settimeout-memory-leak
		var timeout = setTimeout(schedulerLoop, config.collector.schedulerRestartShort);
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
		var query = createQuery(mode);
		networks.findAll(query, function (err, states) {
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
		// no clean up tasks for initial collector
		if (mode === 'initial') {
			return callback(null, []);
		}

		users.findNonActive(function (err, nonActiveUsers) {
			if (err) {
				return callback({message: 'error during users query', err: err});
			}

			if (!nonActiveUsers) {
				return callback({message: 'failed to read nonActiveUsers'});
			}

			callback(null, createCleaningTasks(nonActiveUsers));
		});
	}

	function runTasks(tasks, type, callback) {
		tasks.length > 0 && logger.important('currently allowed to run: ' + tasks.length);

		var started = moment();
		async.series(tasks, function (err) {
			if (err) {
				// report error but continue execution to do not break execution chain..
				logger.error(err);
			}

			var finished = moment();
			var duration = moment.duration(finished.diff(started));

			logger.important(util.format('%s tasks processed: %s, duration: %d sec. (%d mins.)', type, tasks, duration.asSeconds().toFixed(2), duration.asMinutes().toFixed(2)));

			callback(null);
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

	function createCleaningTasks(users) {
		var tasks = users.map(function (user) {
			return disableNetworksTask(user);
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

	function collectingTask(state) {
		return function (callback) { return executor(state, connectors, callback); };
	}

	function disableNetworksTask(user) {
		return function (callback) { return disableNetworks(user, callback); }
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

	return {
		run: function () {
			schedulerLoop();
		}
	};
}

module.exports = scheduler;