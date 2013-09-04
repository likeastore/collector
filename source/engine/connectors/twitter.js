module.exports = require('./twitter.base').bind(null, {
	uri: '/favorites/list.json?include_entities=false',
	preprocess: function (tweets) {
		return tweets;
	}
});