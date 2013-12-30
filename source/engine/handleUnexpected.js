var MAX_ERRORS_ALLOWED = 5;

function handleUnexpected(response, body, state, err, callback) {
	if (typeof err === 'function') {
		callback = err;
	}

	state.errors += 1;

	var status = response ? response.statusCode : body ? body.error_id : err;

	if (status === 401) {
		state.unauthorized = true;
	}

	if (state.errors === MAX_ERRORS_ALLOWED) {
		delete state.errors;
		state.disabled = true;

		return callback({ message: 'Connector disabled, due to max errors count.', body: body, status: status});
	}

	callback(null);
}

module.exports = handleUnexpected;
