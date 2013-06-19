var expect = require('chai').expect;
var rewire = require('rewire');
var moment = require('moment');
var config = require('../../config');
var momentFake = require('../fakes/moment');

describe('engine/executor.js', function () {
	var executor, current, state, updatedState, connector, connectors;

	beforeEach(function () {
		current = moment();
	});

	beforeEach(function () {
		executor = rewire('../../source/engine/executor');
		executor.__set__('moment', momentFake(current));
	});


	describe('when running connector in initial mode', function () {
		beforeEach(function () {
			state = { service: 'github' };

			connector = function (state, callback) {
				state.mode = 'initial';

				callback(null, state);
			};

			connectors = { github: connector };
		});

		beforeEach(function () {
			executor(state, connectors, function (err, state) {
				updatedState = state;
			});
		});

		it ('should schedule to nearest time, according to rate limits', function () {
			var next = current.add(config.collector.quotes.github.runAfter, 'milliseconds');
			var scheduledTo = moment(updatedState.scheduledTo);
			expect(next.diff(scheduledTo)).to.equal(0);
		});
	});

	describe('when running in normal', function () {
		beforeEach(function () {
			state = { service: 'github' };

			connector = function (state, callback) {
				state.mode = 'normal';

				callback(null, state);
			};

			connectors = { github: connector };
		});

		beforeEach(function () {
			executor(state, connectors, function (err, state) {
				updatedState = state;
			});
		});

		it ('should schedule to next allowed time, according to config', function () {
			var next = current.add(config.collector.nextNormalRunAfter, 'milliseconds');
			var scheduledTo = moment(updatedState.scheduledTo);
			expect(next.diff(scheduledTo)).to.equal(0);
		});
	});

	describe('when running in rate limit mode', function () {
		beforeEach(function () {
			state = { service: 'github' };

			connector = function (state, callback) {
				state.mode = 'rateLimit';

				callback(null, state);
			};

			connectors = { github: connector };
		});

		beforeEach(function () {
			executor(state, connectors, function (err, state) {
				updatedState = state;
			});
		});

		it ('should schedule to prevent rate limit, according to config', function () {
			var next = current.add(config.collector.nextRateLimitRunAfter, 'milliseconds');
			var scheduledTo = moment(updatedState.scheduledTo);
			expect(next.diff(scheduledTo)).to.equal(0);
		});
	});
});