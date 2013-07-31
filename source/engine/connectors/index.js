var async = require('async');
var connectors = [
	require('./github'),
	require('./twitter'),
	require('./stackoverflow')
];

module.exports = {
	connect: function (state, callback) {
		function applyConnector(connector, callback) {
			connector.handle(state) && connector.connect(state, callback);
		}

		var results = [];
		async.map(connectors, applyConnector, function (err, results) {
			callback(err, state, results);
		});
	}
};