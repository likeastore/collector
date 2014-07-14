var config = {
	connection: process.env.MONGO_CONNECTION,
	options: { auto_reconnect: true },

	applicationUrl: 'https://app.likeastore.com',
	siteUrl: 'https://likeastore.com',

	elastic: {
		host: {
			protocol: 'https',
			host: 'search.likeastore.com',
			port: 443,
			query: {
				access_token: process.env.ELASTIC_ACCESS_TOKEN
			}
		},

		requestTimeout: 5000
	},

	// api keys
	services: {
		github: {
			appId: process.env.GITHUB_APP_ID,
			appSecret: process.env.GITHUB_APP_SECRET
		},

		twitter: {
			consumerKey: process.env.TWITTER_CONSUMER_KEY,
			consumerSecret: process.env.TWITTER_CONSUMER_SECRET
		},

		facebook: {
			appId: process.env.FACEBOOK_APP_ID,
			appSecret: process.env.FACEBOOK_APP_SECRET
		},

		stackoverflow: {
			clientId: process.env.STACKOVERFLOW_CLIENT_ID,
			clientKey: process.env.STACKOVERFLOW_CLIENT_KEY,
			clientSecret: process.env.STACKOVERFLOW_CLIENT_SECRET
		},

		vimeo: {
			clientId: process.env.VIMEO_CLIENT_ID,
			clientSecret: process.env.VIMEO_CLIENT_SECRET
		},

		youtube: {
			clientId: process.env.YOUTUBE_CLIENT_ID,
			clientSecret: process.env.YOUTUBE_CLIENT_SECRET
		},

		behance: {
			clientId: process.env.BAHANCE_CLIENT_ID,
			clientSecret: process.env.BAHANCE_CLIENT_SECRET
		},

		pocket: {
			consumerKey: process.env.POCKET_CONSUMER_KEY
		},

		tumblr: {
			consumerKey: process.env.TUMBLR_CONSUMER_KEY,
			consumerSecret: process.env.TUMBLR_CONSUMER_SECRET,
		},

		instagram: {
			clientId: process.env.INSTAGRAM_CLIENT_ID,
			clientSecret: process.env.INSTAGRAM_CLIENT_SECRET
		},

		flickr: {
			consumerKey: process.env.FLICKR_CONSUMER_KEY,
			consumerSecret: process.env.FLICKR_CONSUMER_SECRET
		}
	},

	mandrill: {
		token: process.env.MANDRILL_TOKEN
	},

	logentries: {
		token: process.env.LOGENTRIES_TOKEN
	},

	newrelic: {
		application: 'likeastore-collector-' + process.env.COLLECTOR_MODE,
		licenseKey: 'e5862474ee62b99898c861dddfbfa8a89ac54f49'
	},

	logging: {
		level: 'err'
	},

	collector: {
		// scheduler cycle
		schedulerRestart: 1000,

		// scheduler cycle (in case of zero tasks executed previously)
		schedulerRestartLong: 1000 * 60,

		// after collector got to normal mode, next scheduled run in 15 mins
		nextNormalRunAfter: 1000 * 60 * 15,

		// after collector got to rateLimit mode, next scheduled run in hour
		nextRateLimitRunAfter: 1000 * 60 * 60,

		// initial mode quotes
		quotes: {
			facebook: {
				runAfter: 5000
			},

			github: {
				runAfter: 5000
			},

			gist: {
				runAfter: 5000
			},

			twitter: {
				runAfter: 60000
			},

			stackoverflow: {
				runAfter: 5000
			},

			vimeo: {
				runAfter: 5000
			},

			youtube: {
				runAfter: 5000
			},

			dribbble: {
				runAfter: 5000
			},

			behance: {
				runAfter: 5000
			},

			pocket: {
				runAfter: 5000
			},

			tumblr: {
				runAfter: 5000
			},

			instagram: {
				runAfter: 5000
			},

			flickr: {
				runAfter: 5000
			}
		},

		request: {
			timeout: 10000
		}
	}
};

module.exports = config;