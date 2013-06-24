var networks = require('../db/networks');

var runner = {
	run: function (callback) {
		var stream = networks.stream();

		stream.on('error', callback);
		stream.on('data', update);
		stream.on('end', callback);

		function update (network) {
			delete network.lastExecution;
			delete network.quotas;
			delete network.scheduleTo;

			network.mode = 'initial';

			networks.update(network, function (err) {
				if (err) {
					return callback (err);
				}
			});
		}
	}
};

module.exports = runner;