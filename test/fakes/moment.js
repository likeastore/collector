function moment (dateToReturn) {
	return function () {
		return dateToReturn.clone();
	};
}

module.exports = moment;