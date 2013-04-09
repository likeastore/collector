var expect = require('chai').expect;
var factory = require('./../source/engine/connectors/factory');

describe('connectors factory', function () {
	var subscription, task;

	describe('for github', function () {
		beforeEach(function () {
			subscription = { service: 'github' };

			task = factory.create(subscription);
		});

		it('should create github connector', function () {
			expect(task).to.be.ok;
		});
	});

	describe('for twitter', function () {
		beforeEach(function () {
			subscription = { service: 'twitter' };

			task = factory.create(subscription);
		});

		it('should create twitter connector', function () {
			expect(task).to.be.ok;
		});
	});
});