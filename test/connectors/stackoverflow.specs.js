var expect = require('chai').expect;
var nock = require('nock');
var rewire = require('rewire');
var loggerFake = require('../fakes/logger');

xdescribe('engine/connectors/stackoverflow.js', function () {
	var state, connector;

	beforeEach(function () {
		connector = rewire('../../source/engine/connectors/stackoverflow');
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

			describe('first run', function () {
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
						.defaultReplyHeaders({'x-ratelimit-current': 100})
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
					it('with next page', function () {
						expect(updatedState.page).to.equal(2);
					});

					it('stores from fromdate of top item (incremented)', function () {
						expect(updatedState.fromdate).to.equal(1332242921);
					});
				});
			});

			describe('second run', function () {
				beforeEach(function () {
					state = {
						userId: 'user',
						service: 'stackoverflow',
						username: 12345,
						accessToken: 'fakeToken',
						fromdate: 1332242921,
						mode: 'initial',
						page: 2
					};
				});

				beforeEach(function (done) {
					nock('http://api.stackoverflow.com')
						.defaultReplyHeaders({'x-ratelimit-current': 100})
						.get('/1.1/users/12345/favorites?access_token=fakeToken&pagesize=100&sort=creation&page=2')
						.replyWithFile(200, __dirname + '/replies/stackoverflow.connector.normal.json.gz');

					connector(state, function (err, state, favorites) {
						updatedState = state;
						returnedFavorites = favorites;

						done();
					});
				});

				it('goes to normal', function () {
					expect(updatedState.mode).to.equal('normal');
				});

				it('retrieves no data', function () {
					expect(returnedFavorites.length).to.equal(0);
				});

				describe ('updates state', function () {
					it('removes next page', function () {
						expect(updatedState.page).to.not.be.ok;
					});
				});
			});
		});

		describe('in normal mode', function () {
			var updatedState, returnedFavorites;

			describe('no new data', function () {
				beforeEach(function () {
					state = {
						userId: 'user',
						service: 'stackoverflow',
						username: 12345,
						accessToken: 'fakeToken',
						fromdate: 1332242921,
						mode: 'normal'
					};
				});

				beforeEach(function (done) {
					nock('http://api.stackoverflow.com')
						.defaultReplyHeaders({'x-ratelimit-current': 100})
						.get('/1.1/users/12345/favorites?access_token=fakeToken&pagesize=100&sort=creation&fromdate=1332242921')
						.replyWithFile(200, __dirname + '/replies/stackoverflow.connector.normal.json.gz');

					connector(state, function (err, state, favorites) {
						updatedState = state;
						returnedFavorites = favorites;

						done();
					});
				});

				it('retrieves no data', function () {
					expect(returnedFavorites.length).to.equal(0);
				});
			});

			describe('one new favorite', function () {
				beforeEach(function () {
					state = {
						userId: 'user',
						service: 'stackoverflow',
						username: 12345,
						accessToken: 'fakeToken',
						fromdate: 1332242921,
						mode: 'normal'
					};
				});

				beforeEach(function (done) {
					nock('http://api.stackoverflow.com')
						.defaultReplyHeaders({'x-ratelimit-current': 100})
						.get('/1.1/users/12345/favorites?access_token=fakeToken&pagesize=100&sort=creation&fromdate=1332242921')
						.replyWithFile(200, __dirname + '/replies/stackoverflow.connector.new.json.gz');

					connector(state, function (err, state, favorites) {
						updatedState = state;
						returnedFavorites = favorites;

						done();
					});
				});

				it('retrieves new favorite', function () {
					expect(returnedFavorites.length).to.equal(1);
				});

				describe ('updates state', function () {
					it('updates fromdate (incremented)', function () {
						expect(updatedState.fromdate).to.equal(1332242923);
					});
				});
			});

			describe('when meeting rate limit', function () {
				var rateLimitToStop;

				beforeEach(function () {
					rateLimitToStop = 1;
				});

				beforeEach(function () {
					state = {
						userId: 'user',
						service: 'stackoverflow',
						username: 12345,
						accessToken: 'fakeToken',
						fromdate: 1332242921,
						mode: 'normal'
					};
				});

				beforeEach(function (done) {
					nock('http://api.stackoverflow.com')
						.defaultReplyHeaders({'x-ratelimit-current': rateLimitToStop})
						.get('/1.1/users/12345/favorites?access_token=fakeToken&pagesize=100&sort=creation&fromdate=1332242921')
						.replyWithFile(200, __dirname + '/replies/stackoverflow.connector.new.json.gz');

					connector(state, function (err, state, favorites) {
						updatedState = state;
						returnedFavorites = favorites;

						done();
					});
				});

				it ('should set rate limit exceed flag', function () {
					expect(updatedState.mode).to.equal('rateLimit');
				});

				it ('should store previous state', function () {
					expect(updatedState.prevMode).to.equal('normal');
				});

				describe('and run in rateLimit state', function () {
					var updatedUpdatedState;

					beforeEach(function (done) {
						nock('http://api.stackoverflow.com')
							.defaultReplyHeaders({'x-ratelimit-current': 100})
							.get('/1.1/users/12345/favorites?access_token=fakeToken&pagesize=100&sort=creation&fromdate=1332242923')
							.replyWithFile(200, __dirname + '/replies/stackoverflow.connector.new.json.gz');

						connector(updatedState, function (err, state, favorites) {
							updatedUpdatedState = state;
							returnedFavorites = favorites;

							done();
						});
					});

					it ('should go back to previous mode', function () {
						expect(updatedUpdatedState.mode).to.equal('normal');
					});
				});
			});
		});
	});
});