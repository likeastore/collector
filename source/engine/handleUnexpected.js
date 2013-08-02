var users = require('../db/users');
var util = require('util');

var MAX_ERRORS_ALLOWED = 3;

function handleUnexpected(response, body, state, callback) {
	state.errors += 1;

	if (state.errors === MAX_ERRORS_ALLOWED) {
		state.errors = 0;
		state.disabled = true;
	}

	callback({ message: 'Unexpected body type', body: body, status: response ? response.statusCode : body.error_id});
}

module.exports = handleUnexpected;
