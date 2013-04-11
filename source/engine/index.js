var _ = require('underscore');
var async = require('async');
var moment = require('moment');
var tasksBuilder = require('./tasks/builder');
var networks = require('./../db/networks');

function createEngine() {
	var started, finished;
	var queue = async.queue(execute, 10);

	function engineLoop() {
		started = moment();
		console.log('engine session, stated at: ' + started.format());
		console.log('requesting all active networks...');
		networks.all(function (err, subs) {
			console.log('recieved ' + subs.length + ' networks.');

			var tasks = tasksBuilder.create(subs);
			console.log('processed networks, created ' + tasks.length + ' execution tasks.');

			if (tasks.length === 0) {
				return drain();
			}

			tasks.forEach(function (t) {
				queue.push(t);
			});
		});
	}

	function execute(task, callback) {
		return task(callback);
	}

	function drain() {
		finished = moment();

		var executionTime = finished.diff(started);

		console.log('all execution task are done in: ' + executionTime + ' (msec)');
		console.log('ready for next session in 1000 (msec)\n');
		setTimeout(engineLoop, 1000);
	}

	queue.drain = function () {
		drain();
	};

	return {
		start: function () {
			console.log('collector engine is about to start...');
			engineLoop();
		}
	};
}

module.exports = {
	create: createEngine
};