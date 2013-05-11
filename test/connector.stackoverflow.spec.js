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

		describe('and username is missing', function () {
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
				expect(error).to.equal('missing username for user: ' + state.userId);
			});
		});

		describe('and accessToken is missing', function () {
			beforeEach(function () {
				state = {
					userId: 'user',
					service: 'stackoverflow',
					username: 12345
				};
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

		describe('in initial mode', function () {
			var updatedState, returnedFavorites;

			describe.only('first run', function () {
				beforeEach(function () {
					state = {
						userId: 'user',
						service: 'stackoverflow',
						username: 12345,
						accessToken: 'fakeToken'
					};
				});

				beforeEach(function (done) {
					nock('http://api.stackoverflow.com')
						.get('/1.1/users/12345/favorites?access_token=fakeToken&pagesize=100&sort=creation&page=1')
						.replyWithFile(200, __dirname + '/replies/stackoverflow.connector.init.json.gz');

					connector(state, function (err, state, favorites) {
						updatedState = state;
						returnedFavorites = favorites;

						done();
					});
				});

				it('should update state with initial', function () {
					expect(updatedState.mode).to.equal('initial');
				});

				it('retrieves data from first page', function () {
					expect(returnedFavorites.length).to.equal(34);
				});

				describe ('updates state', function () {
					it ('with lastExecution', function () {
						expect(updatedState.lastExecution).to.be.ok;
					});

					it('with next page', function () {
						expect(updatedState.page).to.equal(2);
					});

					it('stores from fromdate of top item (incremented)', function () {
						expect(updatedState.fromdate).to.equal(1332242921);
					});
				});
			});
		});
	});
});