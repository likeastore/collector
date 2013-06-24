var moment = require('moment');
var async = require('async');
var executor = require('./executor');
var items = require('../db/items');
var networks = require('../db/networks');
var logger = require('../utils/logger');
var config = require('../../config');

var PARALLEL_EXECUTION_LIMIT = 32;

function allowedToExecute (state, currentMoment) {
	return (state.scheduledTo && currentMoment.diff(state.scheduledTo) > 0) || true;
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

function execute(tasks, callback) {
	logger.info('currently allowed to execute: ' + tasks.length);

	async.parallelLimit(tasks, PARALLEL_EXECUTION_LIMIT, function (err) {
		return callback ({message: 'tasks execution error', error: err});
	});
}

var scheduler = {
	run: function (connectors) {
		var schedulerLoop = function () {
			networks.findAll(function (err, states) {
				var tasks = schedule(states, connectors);
				execute(tasks, function (err) {
					setTimeout(schedulerLoop, config.collector.schedulerRestart);
				});
			});
		};

		schedulerLoop();
	}
};

module.exports = scheduler;