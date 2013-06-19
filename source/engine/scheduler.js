var moment = require('moment');
var async = require('async');
var executor = require('./executor');
var items = require('../db/items');
var networks = require('../db/networks');
var logger = require('../utils/logger');
var config = require('../../config');

function allowedToExecute (state, currentMoment) {
	return currentMoment.diff(state.scheduledTo) > 0;
}

function schedule(states, connectors) {
	var currentMoment = moment();

	logger.info('scheduler stated at ' + currentMoment.format());
	logger.info('recieved ' + states.length + ' services states');

	var tasks = states.map(function (state) {
		return allowedToExecute(state, currentMoment) ? task(state) : nop(state);
	}).filter(function (task) {
		return task !== nop;
	});

	return tasks;

	function nop (state) {
		return function (callback) { return callback (null, null, null); };
	}

	function task(state) {
		return function (callback) { return executor (state, connectors, callback); };
	}
}

function storeState (state, callback) {
	networks.update(state, callback);
}

function storeData (data, callback) {
	items.update(data, callback);
}

function execute(tasks, callback) {
	logger.info('currently allowed to execute: ' + tasks.length);

	var executionFailures = false;

	// tasks.forEach(function (task) {
	// 	task(taskExecuted);
	// });

	async.parallelLimit(tasks, 10, function (err) {
		return callback (executionFailures ? {message: 'some tasks failed during execution'} : null);
	});


	function taskExecuted(err, state, data) {
		if (err) {
			logger.error({message: 'task executed with error', error: err});
		}

		if (!state || !data) {
			return;
		}

		storeState(state, stateStored);

		function stateStored(err) {
			if (err) {
				executionFailures = true;
				logger.error({message: 'storing state failed', state: state});
			}

			storeData(data, dataStored);
		}

		function dataStored(err, result) {
			if (err) {
				executionFailures = true;
				logger.error({message: 'storing items failed', state: state});
			}
		}
	}
}

var scheduler = {
	run: function (connectors) {
		var schedulerLoop = function () {
			networks.findAll(function (err, states) {
				var tasks = schedule(states, connectors);

				execute(tasks, function (err) {
					// all executed
					setTimeout(schedulerLoop, config.collector.schedulerRestart);
				});
			});
		};

		// start scheduler
		schedulerLoop();
	}
};

module.exports = scheduler;