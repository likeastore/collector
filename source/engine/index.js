var _ = require('underscore');
var async = require('async');
var moment = require('moment');
var tasksBuilder = require('./tasks/builder');
var networks = require('./../db/networks');
var logger = require('./../utils/logger');
var config = require('likeastore-config');

function createEngine() {
	var started, finished;
	var concurrency = 10;
	var queue = async.queue(execute, concurrency);

	function engineLoop() {
		started = moment();
		logger.success('engine session, stated at: ' + started.format());

		networks.all(function (err, subs) {
			logger.info('recieved ' + subs.length + ' networks.');

			var tasks = tasksBuilder.create(subs);
			logger.info('processed networks, created ' + tasks.length + ' execution tasks.');

			if (tasks.length === 0) {
				return drain();
			}

			tasks.forEach(function (t) {
				queue.push(t);
			});
		});
	}

	function execute(task, callback) {
		return task(function(err) {
			if (err) {
				logger.error(err);
			}

			return callback(err);
		});
	}

	function drain() {
		finished = moment();

		var executionTime = finished.diff(started);
		logger.success('all execution task are done in: ' + executionTime + ' (msec)');

		setTimeout(engineLoop, config.collector.engineRestartInterval);
	}

	queue.drain = function () {
		drain();
	};

	return {
		start: function () {
			engineLoop();
		}
	};
}

module.exports = {
	create: createEngine
};