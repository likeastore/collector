function create(sub) {
	if (sub.service === 'github') {
		return require('./github');
	}

	if (sub.service === 'twitter') {
		return require('./twitter');
	}

	return null;
}

module.exports = {
	create: create
};