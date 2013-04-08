var _ = require('underscore');
var events = require('events');

function createEngine() {
	var emitter = new events.EventEmitter();

	var execute = function (jobs, callback) {
		console.log('executing ' + jobs.length + ' jobs...');

		jobs.forEach(function (job) {
			console.log('job for ' + job.userId + ' completed');
			emitter.emit('job/executed', {userId: job.userId});
		});

		return callback(null, []);
	};

	return _.extend(emitter, {
		execute: execute
	});
}

module.exports = {
	create: createEngine
};