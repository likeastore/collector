var expect = require('chai').expect;
var nock = require('nock');
var rewire = require('rewire');
var loggerFake = require('../fakes/logger');

xdescribe('engine/connectors/github.js', function () {
	var state, connector;

	beforeEach(function () {
		connector = rewire('../../source/engine/connectors/github');
		connector.__set__('logger', loggerFake);
	});

	describe('when running', function () {
		var error;

		describe('and accessToken is missing', function () {
			beforeEach(function () {
				state = {
					userId: 'user',
					service: 'github'
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

		describe('and username is missing', function () {
			beforeEach(function () {
				state = {
					userId: 'userId',
					accessToken: 'fakeAccessToken',
					service: 'github'
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
			var updatedState, returnedStars;

			describe('first run', function () {
				beforeEach(function () {
					state = {
						userId: 'userId',
						username: 'fakeGithubUser',
						accessToken: 'fakeAccessToken',
						service: 'github'
					};
				});

				beforeEach(function (done) {
					nock('https://api.github.com')
						.defaultReplyHeaders({ 'x-ratelimit-remaining': 100})
						.get('/users/fakeGithubUser/starred?access_token=fakeAccessToken&per_page=100&page=1')
						.replyWithFile(200, __dirname + '/replies/github.connector.init.json');

					connector(state, function (err, state, stars) {
						updatedState = state;
						returnedStars = stars;

						done();
					});
				});

				it ('still in initial mode', function () {
					expect(updatedState.mode).to.equal('initial');
				});

				it ('retrieves data from first page', function () {
					expect(returnedStars.length).to.equal(30);
				});

				describe ('updates state', function () {
					it('with next page', function () {
						expect(updatedState.page).to.equal(2);
					});

					it('with id of first retrieved item', function () {
						expect(updatedState.sinceId).to.equal(6522993);
					});
				});
			});

			describe('second run', function () {
				beforeEach(function () {
					state = {
						userId: 'userId',
						username: 'fakeGithubUser',
						accessToken: 'fakeAccessToken',
						service: 'github',
						mode: 'initial',
						page: 2
					};
				});

				beforeEach(function (done) {
					nock('https://api.github.com')
						.defaultReplyHeaders({ 'x-ratelimit-remaining': 100})
						.get('/users/fakeGithubUser/starred?access_token=fakeAccessToken&per_page=100&page=2')
						.replyWithFile(200, __dirname + '/replies/github.connector.init.json');

					connector(state, function (err, state, stars) {
						updatedState = state;
						returnedStars = stars;

						done();
					});
				});

				it ('still in initial mode', function () {
					expect(updatedState.mode).to.equal('initial');
				});

				it ('retrieves data from second page', function () {
					expect(returnedStars.length).to.equal(30);
				});

				describe ('updates state', function () {
					it('with next page', function () {
						expect(updatedState.page).to.equal(3);
					});
				});
			});

			describe('third run', function () {
				beforeEach(function () {
					state = {
						userId: 'userId',
						username: 'fakeGithubUser',
						accessToken: 'fakeAccessToken',
						service: 'github',
						mode: 'initial',
						page: 3
					};
				});

				beforeEach(function (done) {
					nock('https://api.github.com')
						.defaultReplyHeaders({ 'x-ratelimit-remaining': 100})
						.get('/users/fakeGithubUser/starred?access_token=fakeAccessToken&per_page=100&page=3')
						.reply(200, []);

					connector(state, function (err, state, stars) {
						updatedState = state;
						returnedStars = stars;

						done();
					});
				});

				it ('goes to normal mode', function () {
					expect(updatedState.mode).to.equal('normal');
				});

				it ('no data on third page', function () {
					expect(returnedStars.length).to.equal(0);
				});

				describe ('updates state', function () {
					it('removes page from state', function () {
						expect(updatedState.page).to.not.be.ok;
					});
				});
			});
		});

		describe('in normal mode', function () {
			var updatedState, returnedStars;

			describe('no new stars', function () {
				beforeEach(function () {
					state = {
						userId: 'userId',
						username: 'fakeGithubUser',
						accessToken: 'fakeAccessToken',
						service: 'github',
						mode: 'normal',
						sinceId: '6522993'
					};
				});

				beforeEach(function (done) {
					nock('https://api.github.com')
						.defaultReplyHeaders({ 'x-ratelimit-remaining': 100})
						.get('/users/fakeGithubUser/starred?access_token=fakeAccessToken&per_page=100')
						.replyWithFile(200, __dirname + '/replies/github.connector.normal.nonew.json');

					connector(state, function (err, state, stars) {
						updatedState = state;
						returnedStars = stars;

						done();
					});
				});

				it ('retrieves no data', function () {
					expect(returnedStars.length).to.equal(0);
				});

				describe ('updates state', function () {
					it('still in normal mode', function () {
						expect(updatedState.mode).to.equal('normal');
					});
				});
			});

			describe('new stars appeared', function () {
				beforeEach(function () {
					state = {
						userId: 'userId',
						username: 'fakeGithubUser',
						accessToken: 'fakeAccessToken',
						service: 'github',
						mode: 'normal',
						sinceId: '6522993'
					};
				});

				beforeEach(function (done) {
					nock('https://api.github.com')
						.defaultReplyHeaders({ 'x-ratelimit-remaining': 100})
						.get('/users/fakeGithubUser/starred?access_token=fakeAccessToken&per_page=100')
						.replyWithFile(200, __dirname + '/replies/github.connector.normal.new.json');

					connector(state, function (err, state, stars) {
						updatedState = state;
						returnedStars = stars;

						done();
					});
				});

				it ('retrieves new data', function () {
					expect(returnedStars.length).to.equal(1);
				});

				describe ('updates state', function () {
					it('still in normal mode', function () {
						expect(updatedState.mode).to.equal('normal');
					});

					it('stores sinceId', function () {
						expect(updatedState.sinceId).to.equal(6522994);
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
						userId: 'userId',
						username: 'fakeGithubUser',
						accessToken: 'fakeAccessToken',
						service: 'github',
						mode: 'normal',
						sinceId: '6522993'
					};
				});

				beforeEach(function (done) {
					nock('https://api.github.com')
						.get('/users/fakeGithubUser/starred?access_token=fakeAccessToken&per_page=100')
						.reply(200, [], { 'x-ratelimit-remaining': rateLimitToStop});

					connector(state, function (err, state, stars) {
						updatedState = state;
						returnedStars = stars;

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
						nock('https://api.github.com')
							.defaultReplyHeaders({ 'x-ratelimit-remaining': 100})
							.get('/users/fakeGithubUser/starred?access_token=fakeAccessToken&per_page=100')
							.replyWithFile(200, __dirname + '/replies/github.connector.normal.new.json');

						connector(updatedState, function (err, state, stars) {
							updatedUpdatedState = state;
							returnedStars = stars;

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