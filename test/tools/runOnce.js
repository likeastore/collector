var config = require('likeastore-config');
var networks = require('./../../source/db/networks');
var db = require('./../../source/db/dbConnector');
var logger = require('./../../source/utils/logger');

var connector = require('./../../source/engine/connectors/github');

networks.find({_id: new db.mongo.ObjectId('519dfa9f3605cec5a2000003')}, function (err, state) {
	if (err) {
		return logger.error('cant read network');
	}

	logger.info('sinceId: ' + state.sinceId);

	connector (state, function (err, state, items) {
		if (err) {
			return logger.error('connector error: ' + JSON.stringify(err));
		}

		logger.success(items);
	});
});