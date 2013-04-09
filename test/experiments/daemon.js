var async = require('async');

function execute(task, callback) {
	return task(callback);
}

console.log('creating queue object with 10 concurrent tasks');
var queue = async.queue(execute, 10);

function createTasks() {
	var timeouts = [1000, 1500, 2000, 1000, 5000];

	return timeouts.map(function (t) {
		return function (callback) {
			console.log('exectuting task with timeout: ' + t);
			return setTimeout(callback, t);
		};
	});
}

function daemon() {
	var tasks = createTasks();
	console.log('recieved the exectution list: ' + tasks.length + ' length.');

	tasks.forEach(function (t) {
		queue.push(t);
	});

	console.log('tasks are pushed into queue.');
}

queue.drain = function () {
	console.log('all tasks in current session has been executed, waiting for 1000ms to restart.');
	setTimeout(daemon, 1000);
};

daemon();