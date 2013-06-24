var expect = require('chai').expect;
var rewire = require('rewire');
var moment = require('moment');
var config = require('../../config');
var momentFake = require('../fakes/moment');

describe('engine/executor.js', function () {
	var scheduleTo, scheduledTo, current, state;

	beforeEach(function () {
		current = moment();
	});

	beforeEach(function () {
		scheduleTo = rewire('../../source/engine/scheduleTo');
		scheduleTo.__set__('moment', momentFake(current));
	});

	describe('when running connector in initial mode', function () {
		beforeEach(function () {
			state = { service: 'github', mode: 'initial' };
		});

		beforeEach(function () {
			scheduleTo(state);
		});

		it ('should schedule to nearest time, according to rate limits', function () {
			var next = current.add(config.collector.quotes.github.runAfter, 'milliseconds');
			expect(next.diff(state.scheduledTo)).to.equal(0);
		});
	});

	describe('when running in normal', function () {
		beforeEach(function () {
			state = { service: 'github', mode: 'normal' };
		});

		beforeEach(function () {
			scheduleTo(state);
		});

		it ('should schedule to next allowed time, according to config', function () {
			var next = current.add(config.collector.nextNormalRunAfter, 'milliseconds');
			expect(next.diff(state.scheduledTo)).to.equal(0);
		});
	});

	describe('when running in rate limit mode', function () {
		beforeEach(function () {
			state = { service: 'github', mode: 'rateLimit' };
		});

		beforeEach(function () {
			scheduleTo(state);
		});

		it ('should schedule to prevent rate limit, according to config', function () {
			var next = current.add(config.collector.nextRateLimitRunAfter, 'milliseconds');
			expect(next.diff(state.scheduledTo)).to.equal(0);
		});
	});
});