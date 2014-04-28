var logger = require('../utils/logger');

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

	state.lastError = { err: err, status: status, body: body};

	if (state.errors >= MAX_ERRORS_ALLOWED) {
		delete state.errors;
		state.disabled = true;

		logger.error({
			message: 'Connector disabled, due to max errors count.',
			body: body,
			status: status,
			err: err
		});
	}

	callback(null);
}

module.exports = handleUnexpected;
