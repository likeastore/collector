var users = require('../db/users');
var util = require('util');

var MAX_ERRORS_ALLOWED = 3;

function notifyUser(state, callback) {
	var message = 'Hello, something wierd is happening. I could not recieve the items from %s :(. It might be since connection is expired, so simple turn the network on, again.';

	users.notifyOnError(state.user, util.format(message, state.service), callback);
}

function handleUnexpected(response, body, state, callback) {
	state.errors += 1;

	if (state.errors === MAX_ERRORS_ALLOWED) {
		return notifyUser(state, disableNetwork);
	}

	function disableNetwork (err) {
		if (err) {
			return callback({message: 'Failed to notify user', err: err});
		}

		state.disabled = true;

		returnError();
	}

	function returnError () {
		callback({ message: 'Unexpected body type', body: body, status: response ? response.statusCode : body.error_id});
	}

	disableNetwork(null);
}

module.exports = handleUnexpected;
