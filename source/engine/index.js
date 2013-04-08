var _ = require('underscore');
var events = require('events');
var executors = require('./executors');

function createEngine() {
	var emitter = new events.EventEmitter();

	var execute = function (jobs, callback) {
		var results = [];
		jobs.forEach(function (job) {
			var executor = executors.createForJob(job);
			executor.run(function (err, executorResults) {
				if (err) {
					return callback(err);
				}

				results.push(executorResults);

				emitter.emit('job/executed', {userId: job.userId, summary: executorResults.summary});
			});

		});

		return callback(null, results);
	};

	return _.extend(emitter, {
		execute: execute
	});
}

module.exports = {
	create: createEngine
};