module.exports = require('./twitter.base').bind(null, {
	uri: '/statuses/user_timeline.json?exclude_replies=true',
	preprocess: function (tweets) {
		return tweets
			   .map(function (tweet) { return tweet.retweeted_status })
			   .filter(Boolean);
	}
});	