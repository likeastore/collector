var util = require('util');
var colors = require('colors');
var moment = require('moment');
var logentries = require('node-logentries');
var config = require('../../config');

var mode = process.env.COLLECTOR_MODE;

var log = logentries.logger({
	token: config.logentries.token,
	printerror: false
});

log.level('info');

module.exports = {
	success: function (message) {
		message = typeof message === 'string' ? message : JSON.stringify(message);
		console.log(this.timestamptMessage(util.format('SUCCESS: %s', message)).green);
		log.log('info', util.format('[%s mode] %s', mode, message));
	},

	warning: function (message) {
		message = typeof message === 'string' ? message : JSON.stringify(message);
		console.log(this.timestamptMessage(util.format('WARNING: %s', message)).yellow);
		log.log('warning', util.format('[%s mode] %s', mode, message));
	},

	error: function (message) {
		message = typeof message === 'string' ? message : JSON.stringify(message);
		console.log(this.timestamptMessage(util.format('ERROR: %s', message)).red);
		log.log('err', util.format('[%s mode] %s', mode, message));
	},

	fatal: function (message) {
		message = typeof message === 'string' ? message : JSON.stringify(message);
		console.log(this.timestamptMessage(util.format('ERROR: %s', message)).red);
		log.log('emerg', util.format('[%s mode] %s', mode, message));
	},

	info: function (message) {
		message = typeof message === 'string' ? message : JSON.stringify(message);
		console.log(this.timestamptMessage(message));
		log.log('info', util.format('[%s mode] %s', mode, message));
	},

	connector: function (name) {
		var me = this;

		return {
			info: function (message) {
				me.info('connector ' + name + ': ' + message);
			},
			warning: function (message) {
				me.warning('connector ' + name + ': ' + message);
			},
			error: function (message) {
				me.error('connector ' + name + ': ' + message);
			},
			success: function (message) {
				me.success('connector ' + name + ': ' + message);
			}
		};
	},

	timestamptMessage: function (message) {
		return util.format('[%s] [%s mode] %s', moment(), mode, message);
	}
};