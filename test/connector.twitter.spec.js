var expect = require('chai').expect;
var nock = require('nock');
var rewire = require('rewire');
var loggerFake = require('./fakes/logger');

describe('engine/connectors/twitter.js', function () {
	var state, connector;

	beforeEach(function () {
		connector = rewire('./../source/engine/connectors/twitter');
		connector.__set__('logger', loggerFake);
	});

	describe('when running', function () {
		var error;

		describe('and accessToken is missing', function () {
			beforeEach(function () {
				state = {
					userId: 'user',
					service: 'twitter'
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

		describe('and accessTokenSecret is missing', function () {
			beforeEach(function () {
				state = {
					userId: 'user',
					accessToken: 'fakeAccessToken',
					service: 'twitter'
				};
			});

			beforeEach(function (done) {
				connector(state, function (err, state, stars) {
					error = err;
					done();
				});
			});

			it('should fail with error', function () {
				expect(error).to.equal('missing accessTokenSecret for user: ' + state.userId);
			});
		});

		describe('and username is missing', function () {
			beforeEach(function () {
				state = {
					userId: 'userId',
					accessToken: 'fakeAccessToken',
					accessTokenSecret: 'fakeAccessToken',
					service: 'twitter'
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

		describe('in initial mode', function () {
			var updatedState, returnedFavorites;

			describe('first run', function () {
				beforeEach(function () {
					state = {
						userId: 'userId',
						accessToken: 'fakeAccessToken',
						accessTokenSecret: 'fakeAccessToken',
						username: 'fakeTwitterUser',
						service: 'twitter'
					};
				});

				beforeEach(function (done) {
					nock('https://api.twitter.com')
						.get('/1.1/favorites/list.json?screen_name=fakeTwitterUser&count=200')
						.replyWithFile(200, __dirname + '/replies/twitter.connector.init.json');

					connector(state, function (err, state, favorites) {
						updatedState = state;
						returnedFavorites = favorites;

						done();
					});
				});
				it ('still in initial mode', function () {
					expect(updatedState.mode).to.equal('initial');
				});

				it ('retrieves data from first page', function () {
					expect(returnedFavorites.length).to.equal(2);
				});

				describe ('updates state', function () {
					it ('with lastExecution', function () {
						expect(updatedState.lastExecution).to.be.ok;
					});

					it('initialize sinceId with first retrieved favorite id', function () {
						expect(updatedState.sinceId).to.equal('332570459445018627');
					});

					it('initialize maxId with last retrieved favorite id', function () {
						expect(updatedState.maxId).to.equal('332542318055919617');
					});
				});
			});

			describe('second run', function () {
				beforeEach(function () {
					state = {
						userId: 'userId',
						accessToken: 'fakeAccessToken',
						accessTokenSecret: 'fakeAccessToken',
						username: 'fakeTwitterUser',
						service: 'twitter',
						maxId: '332542318055919617'
					};
				});

				beforeEach(function (done) {
					nock('https://api.twitter.com')
						.get('/1.1/favorites/list.json?screen_name=fakeTwitterUser&count=200&max_id=332542318055919617')
						.replyWithFile(200, __dirname + '/replies/twitter.connector.second.json');

					connector(state, function (err, state, favorites) {
						updatedState = state;
						returnedFavorites = favorites;

						done();
					});
				});

				it ('still in initial mode', function () {
					expect(updatedState.mode).to.equal('initial');
				});

				it ('retrieves data from first page', function () {
					expect(returnedFavorites.length).to.equal(2);
				});

				describe ('updates state', function () {
					it ('with lastExecution', function () {
						expect(updatedState.lastExecution).to.be.ok;
					});

					it('initialize sinceId with first retrieved favorite id', function () {
						expect(updatedState.sinceId).to.equal('332542318055919615');
					});

					it('initialize maxId with last retrieved favorite id', function () {
						expect(updatedState.maxId).to.equal('332542318055919614');
					});
				});
			});

			describe('third run', function () {
				beforeEach(function () {
					state = {
						userId: 'userId',
						accessToken: 'fakeAccessToken',
						accessTokenSecret: 'fakeAccessToken',
						username: 'fakeTwitterUser',
						service: 'twitter',
						sinceId: '332570459445018627',
						maxId: '332542318055919614'
					};
				});

				beforeEach(function (done) {
					nock('https://api.twitter.com')
						.get('/1.1/favorites/list.json?screen_name=fakeTwitterUser&count=200&max_id=332542318055919614')
						.reply(200, []);

					connector(state, function (err, state, favorites) {
						updatedState = state;
						returnedFavorites = favorites;

						done();
					});
				});

				it ('goes to normal mode', function () {
					expect(updatedState.mode).to.equal('normal');
				});

				it ('retrieves no data', function () {
					expect(returnedFavorites.length).to.equal(0);
				});

				describe ('updates state', function () {
					it ('with lastExecution', function () {
						expect(updatedState.lastExecution).to.be.ok;
					});

					it('removes maxId from state', function () {
						expect(updatedState.maxId).to.not.be.ok;
					});
				});

			});
		});

		describe('in normal mode', function () {
			var updatedState, returnedFavorites;

			beforeEach(function () {
				state = {
					userId: 'userId',
					accessToken: 'fakeAccessToken',
					accessTokenSecret: 'fakeAccessToken',
					username: 'fakeTwitterUser',
					service: 'twitter',
					sinceId: '332570459445018627',
					mode: 'normal'
				};
			});

			beforeEach(function (done) {
				nock('https://api.twitter.com')
					.get('/1.1/favorites/list.json?screen_name=fakeTwitterUser&count=200&since_id=332570459445018627')
					.replyWithFile(200, __dirname + '/replies/twitter.connector.normal.json');

				connector(state, function (err, state, favorites) {
					updatedState = state;
					returnedFavorites = favorites;

					done();
				});
			});

			it ('retrieves data if any', function () {
				expect(returnedFavorites.length).to.equal(2);
			});

			describe ('updates state', function () {
				it ('with lastExecution', function () {
					expect(updatedState.lastExecution).to.be.ok;
				});

				it('still in normal mode', function () {
					expect(updatedState.mode).to.equal('normal');
				});

				it('updates sinceId', function () {
					expect(updatedState.sinceId).to.equal('332542318055919620');
				});
			});

		});
	});
});
