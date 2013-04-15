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

	connnector: function (name) {
		var me = this;

		return {
			info: function (message) {
				console.log(me.timestamptMessage('connector ' + name + ': ' + message).yellow);
			}
		};
	},

	timestamptMessage: function (message) {
		return util.format('[%s] %s', moment(), message);
	}
};