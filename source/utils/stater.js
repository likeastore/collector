var _ = require('underscore');

var stater = {
	updateState: function (current, states, data) {
		var state = _.clone(current);

		states.filter(function (change) {
			return change.condition(state, data);
		}).forEach(function (change) {
			change.apply(state, data);
		});

		return state;
	}
};

module.exports = stater;