var argv = require('optimist').argv;
var memwatch = require('memwatch');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.COLLECTOR_MODE = process.env.COLLECTOR_MODE || argv.mode || 'normal';

var config = require('../config');
var logger = require('./utils/logger');
var scheduler = require('./engine/scheduler');
var appName = 'collector-' + process.env.COLLECTOR_MODE;

if (process.env.NODE_ENV === 'production' && appName === 'collector-normal') {
	require('nodetime').profile({
		accountKey: '183fdc2ea3a416ac65eca419a34d38c74467f35a',
		appName: appName
	});

	memwatch.on('leak', function(info) {
		logger.fatal({msg: 'Memory leak detected', app: appName, info: info});
	});

	memwatch.on('stats', function(stats) {
		var trending = stats.usage_trend > 0;
		if (trending) {
			logger.warning({msg: 'V8 stats (usage trending)', app: appName, stats: stats});
		} else {
			logger.info({msg: 'V8 stats', app: appName, stats: stats});
		}
	});
}

process.on('uncaughtException', function (err) {
	logger.fatal({msg:'Uncaught exception', error:err, stack:err.stack});
	console.log("Uncaught exception", err, err.stack && err.stack.toString());
});

var env = process.env.NODE_ENV;
var mode = process.env.COLLECTOR_MODE;
logger.success(appName + ' started env:' + env + ' mongodb: ' + config.connection + ' mode: ' + mode);

scheduler(mode).run();