var config = require('./config');
var logger = require('./source/utils/logger');
var fork = require('child_process').fork;

// TODO: get rid of initial/normal mode, use sharding of records instead (collector-0, collector-1 etc)
var initial = fork('./source/collector', ['--mode', 'initial', '--id', '0']);
var main = fork('./source/collector', ['--mode', 'normal', '--id', '1']);

initial.on('error', function (err) {
	logger.fatal({message: 'initial collector error', err: err});
});

initial.on('exit', function (code) {
	logger.fatal({message: 'initial collector exit', code: code});
});

main.on('error', function (err) {
	logger.fatal({message: 'normal collector error', err: err});
});

main.on('exit', function (code) {
	logger.fatal({message: 'normal collector exit', code: code});
});