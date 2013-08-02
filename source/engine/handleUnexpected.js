var users = require('../db/users');
var util = require('util');
var logger = require('../utils/logger');

var MAX_ERRORS_ALLOWED = 3;

function handleUnexpected(response, body, state, callback) {
	state.errors += 1;

	logger.warning({message: 'Unexpected response.', body: body, status: response ? response.statusCode : body.error_id,})

	if (state.errors === MAX_ERRORS_ALLOWED) {
		delete state.errors;
		state.disabled = true;

		return callback({ message: 'Connector disabled, due to max errors count.', body: body, status: response ? response.statusCode : body.error_id});
	}

	callback(null);
}

module.exports = handleUnexpected;
