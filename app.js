var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var mode = process.env.COLLECTOR_MODE = process.env.COLLECTOR_MODE || argv.mode || 'normal';

require('./source/utils/memwatch');

var http = require('http');
var https = require('https');
http.globalAgent.maxSockets = 128;
https.globalAgent.maxSockets = 128;

var argv = require('optimist').argv;

var config = require('./config');
var logger = require('./source/utils/logger');
var scheduler = require('./source/engine/scheduler');
var appName = 'collector-' + process.env.COLLECTOR_MODE;

process.on('uncaughtException', function (err) {
	logger.fatal({msg:'Uncaught exception', error:err, stack:err.stack});
	console.log("Uncaught exception", err, err.stack && err.stack.toString());
});

logger.success(appName + ' started env:' + env + ' mongodb: ' + config.connection + ' mode: ' + mode);
scheduler(mode).run();