var expect = require('chai').expect;
var rewire = require('rewire');
var loggerFake = require('../fakes/logger');

describe('engine/connectors/factory.js', function () {
	var factory, subscription, connector;

	beforeEach(function () {
		factory = rewire('../../source/engine/connectors/factory');
		factory.__set__('logger', loggerFake);
	});

	describe('for github', function () {
		beforeEach(function () {
			subscription = { service: 'github' };

			connector = factory.create(subscription);
		});

		it('should create github connector', function () {
			expect(connector).to.be.ok;
		});
	});

	describe('for twitter', function () {
		beforeEach(function () {
			subscription = { service: 'twitter' };

			connector = factory.create(subscription);
		});

		it('should create twitter connector', function () {
			expect(connector).to.be.ok;
		});
	});


	describe('for stackoverflow', function () {
		beforeEach(function () {
			subscription = { service: 'stackoverflow' };

			connector = factory.create(subscription);
		});

		it('should create stackoverflow connector', function () {
			expect(connector).to.be.ok;
		});
	});

	describe('for non-existing (non supported) connector', function () {
		beforeEach(function () {
			subscription = { service: 'non-existing' };

			connector = factory.create(subscription);
		});

		it('should create stackoverflow connector', function () {
			expect(connector).to.not.be.ok;
		});
	});
});