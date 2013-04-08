var _ = require('underscore');
var events = require('events');
var emitter = new events.EventEmitter();

function createEngine() {
	var execute = function (jobs, callback) {
		callback(null, []);
	};

	return {
		execute: execute
	};
}

exports.engine = _.extend(emitter, createEngine());