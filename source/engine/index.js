var _ = require('underscore');
var async = require('async');
var tasksBuilder = require('./tasks/builder');
var subscriptions = require('./../db/subscriptions');

function createEngine() {
	var queue = async.queue(execute, 10);

	function daemon() {
		subscriptions.all(function (err, subs) {
			var tasks = tasksBuilder.create(subs);
			tasks.forEach(function (t) {
				queue.push(t);
			});
		});
	}

	function execute(task, callback) {
		return task(callback);
	}

	queue.drain = function () {
		setTimeout(daemon, 1000);
	};

	return {
		start: function () {
			daemon();
		}
	};
}

module.exports = {
	create: createEngine
};