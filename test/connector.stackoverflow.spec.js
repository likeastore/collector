var expect = require('chai').expect;
var nock = require('nock');
var rewire = require('rewire');
var loggerFake = require('./fakes/logger');

describe.only('engine/connectors/stackoverflow.js', function () {
	var state, connector;

	beforeEach(function () {
		connector = rewire('./../source/engine/connectors/stackoverflow');
		connector.__set__('logger', loggerFake);
	});

	describe('when running', function () {
		var error;

		describe('and stackoverflowId is missing', function () {
			beforeEach(function () {
				state = {
					userId: 'user',
					service: 'stackoverflow'
				};
			});

			beforeEach(function (done) {
				connector(state, function (err, state, stars) {
					error = err;
					done();
				});
			});

			it('should fail with error', function () {
				expect(error).to.equal('missing stackoverflowId for user: ' + state.userId);
			});
		});

		describe('in initial mode', function () {
			var updatedState, returnedFavorites;

			describe('first run', function () {
				beforeEach(function () {
					state = {
						userId: 'user',
						service: 'stackoverflow',
						stackoverflowId: 12345
					};
				});

				beforeEach(function (done) {
					nock('http://api.stackoverflow.com/1.1')
						.get('/users/12345/favorites?pagesize=100&sort=creation&page=1')
						.replyWithFile(200, __dirname + '/replies/stackoverflow.connector.init.json');

					connector(state, function (err, state, favorites) {
						updatedState = state;
						returnedFavorites = favorites;

						done();
					});
				});

				it('should update state with initial', function () {
					expect(updatedState.mode).to.equal('initial');
				});
			});
		});
	});
});