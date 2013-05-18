var util = require('util');
var colors = require('colors');
var moment = require('moment');

module.exports = {
	success: function (message) {
		console.log(this.timestamptMessage(util.format('SUCCESS: %s', message)).green);
	},

	warning: function (message) {
		console.log(this.timestamptMessage(util.format('WARNING: %s', message)).yellow);
	},

	error: function (message) {
		console.log(this.timestamptMessage(util.format('ERROR: %s', message)).red);
	},

	info: function (message) {
		console.log(this.timestamptMessage(message));
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