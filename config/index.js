var util = require('util');

var env = process.env.NODE_ENV || 'development';
var config = util.format('./../config/%s.config.js', env);

module.exports = require(config);