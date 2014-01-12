var memwatch = require('memwatch');
var logger = require('./logger');
var appName = 'collector-' + process.env.COLLECTOR_MODE;

if (process.env.NODE_ENV === 'production' && appName === 'collector-normal') {
	memwatch.on('leak', function(info) {
		logger.warning({msg: 'Memory leak detected', app: appName, info: info});
	});

	memwatch.on('stats', function(stats) {
		var trending = stats.usage_trend > 0;
		if (trending) {
			return logger.warning({msg: 'V8 stats (usage trending)', app: appName, stats: stats});
		}

		logger.info({msg: 'V8 stats', app: appName, stats: stats});
	});
}
