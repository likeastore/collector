var expect = require('chai').expect;
var moment = require('moment');
var builder = require('./../source/engine/tasks/builder');

describe('engine/tasks/builder.js', function () {
	var networks, tasks;
	describe('empty list of networks', function () {
		beforeEach(function () {
			networks = [];
			tasks = builder.create(networks);
		});

		it('should create empty list of tasks', function () {
			expect(tasks).to.eql([]);
		});
	});

	describe('not empty list of networks', function () {
		describe('with one subscription', function () {
			describe('without last execution', function () {
				beforeEach(function () {
					networks = [{
						userId: 'id',
						service: 'github'
					}];

					tasks = builder.create(networks);
				});

				it('should create one task', function () {
					expect(tasks.length).to.equal(1);
				});
			});
		});

		describe('with several subscription', function () {
			beforeEach(function () {
				networks = [{
					userId: 'id_1',
					service: 'github',
					quotas: {
						requests: {
							perMinute: 5
						}
					},
					lastExecution: moment().subtract(5, 'minutes').format()
				}, {
					userId: 'id_1',
					service: 'twitter',
					quotas: {
						requests: {
							perMinute: 1
						}
					}
				}, {
					userId: 'id_2',
					service: 'twitter',
					quotas: {
						requests: {
							perMinute: 1
						}
					},
					lastExecution: moment().subtract(5, 'minutes').format()
				}];

				tasks = builder.create(networks);
			});

			it('should create 3 tasks', function () {
				expect(tasks.length).to.equal(3);
			});
		});
	});

	describe('quotas calculation', function () {
		describe('lastExecution at the current moment', function () {
			beforeEach(function () {
				networks = [{
					userId: 'id_1',
					service: 'github',
					quotas: {
						requests: {
							perMinute: 5
						}
					},
					lastExecution: moment().format()
				}];

				tasks = builder.create(networks);
			});

			it('should not create any tasks', function () {
				expect(tasks.length).to.equal(0);
			});
		});

		describe('lastExecution happed 5 seconds ago', function () {
			beforeEach(function () {
				networks = [{
					userId: 'id_1',
					service: 'github',
					quotas: {
						requests: {
							perMinute: 5
						}
					},
					lastExecution: moment().subtract(5, 'seconds').format()
				}];

				tasks = builder.create(networks);
			});

			it('should not create any tasks', function () {
				expect(tasks.length).to.equal(0);
			});
		});

		describe('lastExecution happed 12 seconds ago', function () {
			beforeEach(function () {
				networks = [{
					userId: 'id_1',
					service: 'github',
					quotas: {
						requests: {
							perMinute: 5
						}
					},
					lastExecution: moment().subtract(12, 'seconds').format()
				}];

				tasks = builder.create(networks);
			});

			it('should not create any tasks', function () {
				expect(tasks.length).to.equal(0);
			});
		});

		describe('lastExecution happed 13 seconds ago', function () {
			beforeEach(function () {
				networks = [{
					userId: 'id_1',
					service: 'github',
					quotas: {
						requests: {
							perMinute: 5
						}
					},
					lastExecution: moment().subtract(13, 'seconds').format()
				}];

				tasks = builder.create(networks);
			});

			it('should create new task', function () {
				expect(tasks.length).to.equal(1);
			});
		});

		describe('rate limit', function () {
			describe('when enter rate limit', function () {
				beforeEach(function () {
					networks = [{
						userId: 'id_1',
						service: 'github',
						quotas: {
							requests: {
								perMinute: 5,
								repeatAfterMinutes: 15
							}
						},
						rateLimitExceed: true,
						lastExecution: moment().subtract(15, 'seconds').format()
					}];

					tasks = builder.create(networks);
				});

				it ('should not create task for it', function () {
					expect(tasks.length).to.equal(0);
				});
			});

			describe('when leave rate limit', function () {
				beforeEach(function () {
					networks = [{
						userId: 'id_1',
						service: 'github',
						quotas: {
							requests: {
								perMinute: 5,
								repeatAfterMinutes: 15
							}
						},
						rateLimitExceed: true,
						lastExecution: moment().subtract(16, 'minutes').format()
					}];

					tasks = builder.create(networks);
				});

				it ('should create task for it', function () {
					expect(tasks.length).to.equal(1);
				});
			});
		});
	});
});