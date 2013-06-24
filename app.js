var express = require('express');
var http = require('http');
var path = require('path');
var config = require('./config');

var app = express();
var logger = require('./source/utils/logger');
var connectors = require('./source/engine/connectors');
var scheduler = require('./source/engine/scheduler');
var patches = require('./source/patches');

process.on('uncaughtException', function (err) {
	logger.error({msg:'Uncaught exception', error:err, stack:err.stack});
	console.log("Uncaught exception", err, err.stack && err.stack.toString()); //extra log, makes stack track clickable in webstorm
});

app.configure(function(){
	app.set('port', process.env.VCAP_APP_PORT || 3002);
	app.set('views', __dirname + '/views');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});


http.createServer(app).listen(app.get('port'), function() {
	var env = process.env.NODE_ENV || 'development';
	logger.success("likeastore-collector listening on port " + app.get('port') + ' ' + env + ' mongodb: ' + config.connection);

	patches.run(function (err) {
		if (err) {
			logger.error('patches failed');
		}

		logger.success('patches success');
	});
});