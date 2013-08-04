var argv = require('optimist').argv;

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.COLLECTOR_MODE = process.env.COLLECTOR_MODE || argv.mode || 'normal';

var config = require('../config');
var logger = require('./utils/logger');
var connectors = require('./engine/connectors');
var scheduler = require('./engine/scheduler');

process.on('uncaughtException', function (err) {
	logger.fatal({msg:'Uncaught exception', error:err, stack:err.stack});
	console.log("Uncaught exception", err, err.stack && err.stack.toString());
});

var env = process.env.NODE_ENV;
var mode = process.env.COLLECTOR_MODE;
logger.success('likeastore-collector started env:' + env + ' mongodb: ' + config.connection + ' mode: ' + mode);

scheduler.run(mode, connectors);