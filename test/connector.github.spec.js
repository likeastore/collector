var expect = require('chai').expect;
var nock = require('nock');
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
					userId: 'userId',
					accessToken: 'fakeAccessToken',
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

		describe('in initial mode', function () {
			var updatedState, returnedStars;

			describe('first run', function () {
				beforeEach(function () {
					state = {
						userId: 'userId',
						username: 'fakeGithubUser',
						accessToken: 'fakeAccessToken',
						service: 'github',
						mode: 'initial'
					};

					connector = factory.create(state);
				});

				beforeEach(function (done) {
					nock('https://api.github.com')
						.get('/users/fakeGithubUser/starred?access_token=fakeAccessToken&page=1')
						.replyWithFile(200, __dirname + '/replies/github.connector.page1.json');

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
					it ('with lastExecution', function () {
						expect(updatedState.lastExecution).to.be.ok;
					});

					it('with next page', function () {
						expect(updatedState.page).to.equal(2);
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

					connector = factory.create(state);
				});

				beforeEach(function (done) {
					nock('https://api.github.com')
						.get('/users/fakeGithubUser/starred?access_token=fakeAccessToken&page=2')
						.replyWithFile(200, __dirname + '/replies/github.connector.page1.json');

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
					it ('with lastExecution', function () {
						expect(updatedState.lastExecution).to.be.ok;
					});

					it('with next page', function () {
						expect(updatedState.page).to.equal(3);
					});
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