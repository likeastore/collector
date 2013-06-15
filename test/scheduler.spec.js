var moment;
var db, config, scheduler;

// all currently available connectors..
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


// helper connector executor function
function executor (state, connectors, callback) {
	var connector = connectors[state.connector];
	connector(state, callback);
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
		return function (callback) { return callback (null, null); };
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

function execute(tasks) {
	tasks.forEach(function (task) {
		task(taskExecuted);
	});

	function taskExecuted(err, state, data) {
		// result from nop operation
		if (!state || !data) {
			return;
		}

		storeState(state, stateStored);

		function stateStored(err) {
			var stateSaveError = err;

			storeData(data, dataStored);
		}

		function dataStored(dataSaveError, stateSaveError) {
			if (dataStored) {
				return; // log error
			}

			if (stateSaveError) {
				return; // log error
			}
		}
	}
}

var scheduler = {
	run: function (connectors) {
		var schedulerLoop = function () {
			db.networks.findAll(function (err, states) {
				var tasks = schedule(states, connectors);

				execute(tasks, function (err, resuls) {
					// all executed
					setTimeout(schedulerLoop, config.scheduler.timeout);
				});
			});
		};

		// start scheduler
		schedulerLoop();
	}
};