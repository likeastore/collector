// var expect = require('chai').expect;
// var engineFactory = require('./../source/engine');

// describe('engine', function () {
// 	var engine, jobs, jobExecuted;

// 	beforeEach(function () {
// 		jobExecuted = [];

// 		engine = engineFactory.create();

// 		engine.on('job/executed', function (data) {
// 			jobExecuted.push(data);
// 		});
// 	});

// 	describe('running without jobs', function () {
// 		beforeEach(function (done) {
// 			jobs = [];

// 			engine.execute(jobs, function (err, results) {
// 				expect(err).to.not.be.ok;
// 				done();
// 			});
// 		});

// 		it('should nothing be executed', function () {
// 			expect(jobExecuted.length).to.equal(0);
// 		});
// 	});

// 	describe('running one job', function () {
// 		beforeEach(function (done) {
// 			jobs = [{
// 				userId: 'a@a.com',
// 				service: 'github',
// 				quotas: {
// 					reqPerMin: 5
// 				}
// 			}];

// 			engine.execute(jobs, function (err, results) {
// 				expect(err).to.not.be.ok;
// 				done();
// 			});
// 		});

// 		it('should execute one job', function () {
// 			expect(jobExecuted.length).to.equal(1);
// 		});
// 	});
// });