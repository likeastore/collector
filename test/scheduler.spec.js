var moment;
var db, config, scheduler;
var logger;

// all currently available connectors.. (should be corrected with new collector behavior)
var twitter = function (state, callback) {

};

var github = function (state, callback) {

};

var stackoverflow = function (state, callback) {

};

// .. put to map
var connectors = {
	'twitter': twitter,
	'github': github,
	'stackoverflow': stackoverflow
};

// starting up scheduler (infinite execution)
scheduler.run(connectors);


// helper connector executor function (could be overkill)
function executor (state, connectors, callback) {
	var connector = connectors[state.connector];
	var currentState = state;

	connector(state, function (err, state, results) {
		if (err) {
			return callback (err, currentState);
		}

		state.scheduledTo = scheduleTo(state);

		callback(null, state, results);
	});

	function scheduleTo(state) {
		var currentMoment = moment();
		var modes = {
			initial: function () {
				return 0;
			},
			normal: function () {
				return 0;
			},
			ratelimit: function () {
				return 0;
			}
		};

		return modes[state.mode]();
	}
}

// only checks the time stamp, connector is responsible to calculate that
function allowedToExecute (state, currentMoment) {
	return currentMoment.diff(state.scheduledTo, 'milliseconds') > 0;
}

// main scheduler function
function schedule(states, connectors) {
	var currentMoment = moment();

	var tasks = states.map(function (state) {
		return allowedToExecute(state, currentMoment) ? task(state) : nop(state);
	});

	return tasks;

	function nop (state) {
		return function (callback) { return callback (null, null, null); };
	}

	function task(state) {
		return function (callback) { return executor (state, connectors, callback); };
	}
}

function storeState (state, callback) {
	db.networks.update(state, callback);
}

function storeData (data, callback) {
	db.items.update(data, callback);
}

function execute(tasks, callback) {
	var executionFailures = false;
	tasks.forEach(function (task) {
		task(taskExecuted);
	});

	return callback (executionFailures ? {message: 'some tasks failed during execution'} : null);

	function taskExecuted(err, state, data) {
		if (err) {

		}

		if (!state || !data) {
			return;
		}

		storeState(state, stateStored);

		function stateStored(err) {
			if (err) {
				executionFailures = true;
				logger.error({message: 'storing state failed', state: state});
			}

			storeData(data, dataStored);
		}

		function dataStored(err, result) {
			if (err) {
				executionFailures = true;
				logger.error({message: 'storing items failed', state: state});
			}
		}
	}
}

var scheduler = {
	run: function (connectors) {
		var schedulerLoop = function () {
			db.networks.findAll(function (err, states) {
				var tasks = schedule(states, connectors);

				execute(tasks, function (err) {
					// all executed
					setTimeout(schedulerLoop, config.scheduler.timeout);
				});
			});
		};

		// start scheduler
		schedulerLoop();
	}
};