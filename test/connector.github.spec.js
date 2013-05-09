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

	});

});