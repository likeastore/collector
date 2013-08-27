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

function schedule(mode, states, connectors) {
	var currentMoment = moment();

	var tasks = states.map(function (state) {
		return allowedToExecute(state, currentMoment) ? task(state) : null;
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

function createQuery(mode) {
	var queries = {
		initial: {
			$or: [ {mode: {$exists: false }}, { mode: 'initial'}, {mode: 'rateLimit'}]
			//$and: [ {disabled: {$exists: false}}, {disabled: {$eq: false}}, {skip: {$exists: false}}, {skip: {$eq: false}}]
		},

		normal: {
			mode: 'normal'
			//$and: [ {mode: 'normal'}, {disabled: {$exists: false}}, {disabled: {$eq: false}}, {skip: {$exists: false}}, {skip: {$eq: false}}]
		}
	};

	return queries[mode];

}

var scheduler = {
	run: function (mode, connectors) {
		function schedulerLoop() {
			var query = createQuery(mode);
			console.log(query);

			networks.findAll(query, function (err, states) {
				if (err && !states) {
					logger.error({message: 'failed to read network states (restarting loop)', err: err});
					return setTimeout(schedulerLoop, config.collector.schedulerRestart);
				}

				var tasks = schedule(mode, states, connectors);
				var started = moment();

				execute(tasks, function (err) {
					var finished = moment();
					var duration = moment.duration(finished.diff(started));

					logger.info('collection cycle: ' + duration.asSeconds() + ' sec. (' + duration.asMinutes() + ' mins.)');

					setTimeout(schedulerLoop, config.collector.schedulerRestart);
				});
			});
		}

		schedulerLoop();
	}
};

module.exports = scheduler;