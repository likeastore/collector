var argv = require('optimist').argv;

var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var mode = process.env.COLLECTOR_MODE = process.env.COLLECTOR_MODE || argv.mode || 'normal';

require('newrelic');
require('./source/utils/memwatch');

var http = require('http');
var https = require('https');
http.globalAgent.maxSockets = 128;
https.globalAgent.maxSockets = 128;

var config = require('./config');
var logger = require('./source/utils/logger');
var scheduler = require('./source/engine/scheduler');
var appName = 'collector-' + process.env.COLLECTOR_MODE;

logger.success(appName + ' started env:' + env + ' mongodb: ' + config.connection + ' mode: ' + mode);
scheduler(mode).run();