var util = require('util');
var colors = require('colors');
var moment = require('moment');
var logentries = require('node-logentries');
var log = logentries.logger({
	token:process.env.LOGENTRIES_TOKEN
});

module.exports = {
	success: function (message) {
		console.log(this.timestamptMessage(util.format('SUCCESS: %s', message)).green);
		log.log('success', { message: message });
	},

	warning: function (message) {
		console.log(this.timestamptMessage(util.format('WARNING: %s', message)).yellow);
		log.log('warning', { message: message });
	},

	error: function (message) {
		console.log(this.timestamptMessage(util.format('ERROR: %s', message)).red);
		log.log('error', { message: message });
	},

	info: function (message) {
		console.log(this.timestamptMessage(message));
		log.info({ message: message });
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
		return util.format('[%s] %s', moment(), message);
	}
};