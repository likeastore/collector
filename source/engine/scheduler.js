var moment = require('moment');
var async = require('async');
var executor = require('./executor');
var items = require('../db/items');
var networks = require('../db/networks');
var logger = require('../utils/logger');
var config = require('../../config');

function allowedToExecute (state, currentMoment) {
	if (!state.scheduledTo) {
		return true;
	}

	return currentMoment.diff(state.scheduledTo) > 0;
}

function schedule(states, connectors) {
	var currentMoment = moment();

	logger.info('scheduler stated at: ' + currentMoment.format());
	logger.info('recieved ' + states.length + ' services states');

	var tasks = states.map(function (state) {
		return !state.skip && allowedToExecute(state, currentMoment) ? task(state) : null;
	}).filter(function (task) {
		return task !== null;
	});

	return tasks;

	function task(state) {
		return function (callback) { return executor (state, connectors, callback); };
	}
}

function execute(tasks, callback) {
	logger.info('currently allowed to execute: ' + tasks.length);

	async.series(tasks, function (err) {
		return callback ({message: 'tasks execution error', error: err});
	});
}

var scheduler = {
	run: function (connectors) {
		var schedulerLoop = function () {
			networks.findAll(function (err, states) {
				var tasks = schedule(states, connectors);

				var started = moment();

				execute(tasks, function (err) {
					var finished = moment();
					var duration = moment.duration(finished.diff(started));

					logger.info('collection cycle: ' + duration.asSeconds() + ' sec. (' + duration.asMinutes() + ' mins.)');

					setTimeout(schedulerLoop, config.collector.schedulerRestart);
				});
			});
		};

		schedulerLoop();
	}
};

module.exports = scheduler;