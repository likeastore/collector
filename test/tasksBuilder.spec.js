var expect = require('chai').expect;
var moment = require('moment');
var builder = require('./../source/engine/tasks/builder');

describe('tasks builder', function () {
	var subscriptions, tasks;
	describe('empty list of subscriptions', function () {
		beforeEach(function () {
			subscriptions = [];
			tasks = builder.create(subscriptions);
		});

		it('should create empty list of tasks', function () {
			expect(tasks).to.eql([]);
		});
	});

	describe('not empty list of subscriptions', function () {
		describe('with one subscription', function () {
			describe('without last execution', function () {
				beforeEach(function () {
					subscriptions = [{
						userId: 'id',
						service: 'github'
					}];

					tasks = builder.create(subscriptions);
				});

				it('should create one task', function () {
					expect(tasks.length).to.equal(1);
				});
			});

			describe('with last execution later than quota', function () {
				beforeEach(function () {
					subscriptions = [{
						userId: 'id',
						service: 'github',
						quotas: {
							requests: {
								perMinute: 3
							}
						},
						lastExecution: moment().subtract(5, 'minutes').format()
					}];

					tasks = builder.create(subscriptions);
				});

				it('should create one task', function () {
					expect(tasks.length).to.equal(1);
				});
			});

			describe('with last execution earlier than quota', function () {
				beforeEach(function () {
					subscriptions = [{
						userId: 'id',
						service: 'github',
						quotas: {
							requests: {
								perMinute: 3
							}
						},
						lastExecution: moment().subtract(1, 'minutes').format()
					}];

					tasks = builder.create(subscriptions);
				});

				it('should not create new task', function () {
					expect(tasks.length).to.equal(0);
				});
			});

			describe('with last execution exactly as quota', function () {
				beforeEach(function () {
					subscriptions = [{
						userId: 'id',
						service: 'github',
						quotas: {
							requests: {
								perMinute: 5
							}
						},
						lastExecution: moment().subtract(5, 'minutes').format()
					}];

					tasks = builder.create(subscriptions);
				});

				it('should not create new task', function () {
					expect(tasks.length).to.equal(0);
				});
			});
		});

		describe('with several subscription', function () {
			beforeEach(function () {
				subscriptions = [{
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

				tasks = builder.create(subscriptions);
			});

			it('should create 2 tasks', function () {
				expect(tasks.length).to.equal(2);
			});
		});
	});
});