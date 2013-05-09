var expect = require('chai').expect;
var factory = require('./../source/engine/connectors/factory');

describe('engine/connectors/github.js', function () {
	var state, connector;

	describe('when initializing', function () {
		beforeEach(function () {
			connector = factory.create({ service: 'github' });
		});

		it('should exist', function () {
			expect(connector).to.be.ok;
		});
	});

	describe('when running', function () {
		var error;

		describe('and accessToken is missing', function () {
			beforeEach(function () {
				state = {
					userId: 'user',
					service: 'github'
				};

				connector = factory.create(state);
			});

			beforeEach(function (done) {
				connector(state, function (err, state, stars) {
					error = err;
					done();
				});
			});

			it('should fail with error', function () {
				expect(error).to.equal('missing accessToken for user: ' + state.userId);
			});
		});

		describe('and username is missing', function () {
			beforeEach(function () {
				state = {
					userId: 'user',
					accessToken: 'accessToken',
					service: 'github'
				};

				connector = factory.create(state);
			});

			beforeEach(function (done) {
				connector(state, function (err, state, stars) {
					error = err;
					done();
				});
			});

			it('should fail with error', function () {
				expect(error).to.equal('missing username for user: ' + state.userId);
			});
		});

		describe('in initial mode (three pages)', function () {
			describe('first run', function () {
				it ('still in initial mode', function () {

				});

				it ('retrieves data from first page', function () {

				});

				it ('updates state', function () {

				});
			});

			describe('second run', function () {
				it ('still in initial mode', function () {

				});

				it ('retrieves data from second page', function () {

				});

				it ('updates state', function () {

				});
			});

			describe('third run', function () {
				it ('goes to normal mode', function () {

				});

				it ('no data on third page', function () {

				});

				it ('updates state', function () {

				});
			});
		});

		describe('in normal mode', function () {
			it ('retrieves data if any', function () {

			});

			it ('updates state', function () {

			});
		});
	});
});