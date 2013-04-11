var _ = require('underscore');
var async = require('async');
var moment = require('moment');
var tasksBuilder = require('./tasks/builder');
var subscriptions = require('./../db/subscriptions');

function createEngine() {
	var started, finished;
	var queue = async.queue(execute, 10);

	function engineLoop() {
		console.log('requesting all active subscriptions...');

		started = moment();
		subscriptions.all(function (err, subs) {
			console.log('recieved ' + subs.length + ' subscriptions.');

			var tasks = tasksBuilder.create(subs);
			console.log('processed subscriptions, created ' + tasks.length + 'execution tasks.');

			tasks.forEach(function (t) {
				queue.push(t);
			});

			console.log('execution tasks pushed to queue.');
		});
	}

	function execute(task, callback) {
		return task(callback);
	}

	queue.drain = function () {
		finished = moment();

		var executionTime = finished.diff(started);
		console.log('all execution task are done in: ' + executionTime + ' (msec)');
		console.log('ready for next session in 1000 (msec)');
		setTimeout(engineLoop, 1000);
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