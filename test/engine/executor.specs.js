var expect = require('chai').expect;
var rewire = require('rewire');
var loggerFake = require('../fakes/logger');

describe('engine/executor.js', function () {
	describe('when running connector in initial mode', function () {
		it ('should schedule to nearest time, according to rate limits', function () {

		});
	});

	describe('when running in normal', function () {
		it ('should schedule to next allowed time, according to config', function () {

		});
	});

	describe('when running in rate limit mode', function () {
		it ('should schedule to prevent rate limit, according to config', function () {

		});
	});
});