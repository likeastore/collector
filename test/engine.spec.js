var expect = require('chai').expect;
var engine = require('./../source/engine').engine;

describe('engine', function () {
	var jobs;
	var jobExecuted = [];

	describe('initialization', function () {
		it('should exist', function () {
			expect(engine).to.be.ok;
		});
	});

	describe('running without jobs', function () {
		beforeEach(function () {
			jobs = [];
		});

		beforeEach(function () {
			engine.on('job/executed', function (data) {
				jobExecuted.push(data);
			});
		});

		beforeEach(function (done) {
			engine.execute(jobs, function (err, results) {
				expect(err).to.not.be.ok;
				done();
			});
		});

		it('should nothing be executed', function () {
			expect(jobExecuted.length).to.equal(0);
		});
	});
});