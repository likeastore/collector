var config = {
	connection: 'mongodb://localhost:27017/likeastoredb',
	options: { auto_reconnect: true },

	applicationUrl: 'http://localhost:3001',
	siteUrl: 'http://localhost:3000',

	elastic: {
		host: {
			host: 'localhost',
			port: 9200
		},

		requestTimeout: 5000
	},

	// api keys
	services: {
		github: {
			appId: 'dc3c7a7050dccee24ed3',
			appSecret: 'c18dde90f5e928a39b0f0432d5125a3e0a31a23d'
		},

		twitter: {
			consumerKey: 'dgwuxgGb07ymueGJF0ug',
			consumerSecret: 'eusoZYiUldYqtI2SwK9MJNbiygCWOp9lQX7i5gnpWU'
		},

		facebook: {
			appId: '394024317362081',
			appSecret: 'bc86f2ab9afcb1227227146e5ea9ad44'
		},

		stackoverflow: {
			clientId: '1533',
			clientKey: 'J2wyheThU5jYFiOpGG22Eg((',
			clientSecret: 'KOCBFY4OUP6OE7Q1xNw1wA(('
		},

		vimeo: {
			clientId: 'd445a0de20a3b178b0422ad0c6d5891bdfd00b97',
			clientSecret: 'e8e0008413ae1d1ed3e45d8c89d7943ad3937167'
		},

		youtube: {
			clientId: '955769903356-5f1407fo9efvljm3hhl5b8mbhos61blq.apps.googleusercontent.com',
			clientSecret: 'QtlyTnCusfX7G7fbjaEkdmHK'
		},

		behance: {
			clientId: 'JyyJsEZRbcqTXcukjnq8ivQMb7BfAIUd',
			clientSecret: 'L2s8uQl3s7G5uy2ECeRp9dHeWuyA6mrj'
		},

		pocket: {
			consumerKey: '24341-1a1bc9c0ad0f3ffa9eb3194b'
		},

		tumblr: {
			consumerKey: '6vUnFztIzNd6ISG8kBn7UyhGkHA8a49UjXUx9rCYbrWBnbFZBr',
			consumerSecret: 'pnUrbwgmLHubWqaBxRIzD216FxAq8wZCzf2hXysL9huV1Sfq9R'
		},

		flickr: {
			consumerKey: 'de1be7a4d307073deca73ad46d9faf40',
			consumerSecret: '6103498d0db1c48a'
		}
	},

	mandrill: {
		token: '2kXX0stV1Hf56y9DYZts3A'
	},

	logentries: {
		token: null
	},

	newrelic: {
		application: 'likeastore-collector-dev-' + process.env.COLLECTOR_MODE,
		licenseKey: null
	},

	logging: {
		level: 'debug'
	},

	collector: {
		// scheduler cycle
		schedulerRestartShort: 1000,

		// scheduler cycle (in case of zero tasks executed previously)
		schedulerRestartLong: 1000,

		// after collector got to normal mode, next scheduled run in 10 sec
		nextNormalRunAfter: 1000 * 10,

		// after collector got to rateLimit mode, next scheduled run in 15 min
		nextRateLimitRunAfter: 1000 * 60 * 15,

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
			timeout: 5000
		}
	}
};

module.exports = config;