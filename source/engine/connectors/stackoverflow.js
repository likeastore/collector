var request = require('request');
var zlib = require('zlib');
var MemoryStream = require('memstream').MemoryStream;
var logger = require('./../../utils/logger');
var moment = require('moment');
var util = require('util');
var helpers = require('./../../utils/helpers');

var API = 'http://api.stackoverflow.com/1.1';

var stateChanges = [
	// last execution
	{
		condition: function (state, data) {
			return true;
		},
		apply: function (state, data) {
			state.lastExecution = moment().format();
		}
	},
	// intialize sinceId
	{
		condition: function (state, data) {
			return state.mode === 'initial' && data.length > 0 && !state.sinceId;
		},
		apply: function (state, data) {
			state.sinceId = data[0].itemId;
		}
	},
	// increment page
	{
		condition: function (state, data) {
			return state.mode === 'initial' && data.length > 0;
		},
		apply: function (state, data) {
			state.page = state.page + 1;
		}
	},
	{
		condition: function (state, data) {
			return state.mode === 'normal' && data.length > 0;
		},
		apply: function (state, data) {
			state.sinceId = data[0].itemId;
		}
	},
	// go to normal
	{
		condition: function (state, data) {
			return state.mode === 'initial' && data.length === 0;
		},
		apply: function (state, data) {
			state.mode = 'normal';
			delete state.page;
		}
	}
];

function connector(state, callback) {
	var username = state.username;
	var accessToken = state.accessToken;
	var log = logger.connector('stackoverflow');

	if (!username) {
		return callback('missing username for user: ' + state.userId);
	}

	if (!accessToken) {
		return callback('missing username for user:' + state.userId);
	}

	initState(state);

	log.info('prepearing request in (' + state.mode + ') mode.');

	var uri = formatRequestUri(username, accessToken, state);
	var headers = { 'Content-Type': 'application/json', 'Accept-Encoding': 'gzip', 'User-Agent': 'likeastore/collector'};

	var unzippedResponse = '';
	var stream = new MemoryStream(function (buffer) {
		unzippedResponse += buffer;
	}).on('end', function () {
		return handleResponse(JSON.parse(unzippedResponse));
	});

	request({uri: uri, headers: headers}, function (err, response) {
		if (err) {
			return callback(err);
		}

		log.info('rate limit remaining: ' + response.headers['x-ratelimit-current'] + ' for user: ' + state.userId);
	}).pipe(zlib.createGunzip()).pipe(stream);

	function initState(state) {
		if (!state.mode) {
			state.mode = 'initial';
		}

		if (state.mode === 'initial' && !state.page) {
			state.page = 1;
		}
	}

	function formatRequestUri(username, accessToken, state) {
		var base = util.format('%s/users/%s/favorites?access_token=%s&pagesize=100&sort=creation', API, username, accessToken);
		return state.mode === 'initial' || state.page ?
			util.format('%s&page=%s', base, state.page) :
			base;
	}

	function handleResponse(body) {
		var favorites = body.questions.map(function (fav) {
			return {
				itemId: fav.id_str,
				userId: state.userId,
				date: moment(fav.creation_date).format(),
				description: fav.title,
				avatarUrl: 'http://gravatar.com/' + fav.owner.email_hash,
				source: 'http://stackoverflow.com/questions' + fav.question_id,
				favorites: fav.favorite_count,
				type: 'stackoverflow'
			};
		});

		log.info('retrieved ' + favorites.length + ' favorites');

		return callback(null, updateState(state, favorites), favorites);
	}

	function updateState(state, stars) {
		stateChanges.filter(function (change) {
			return change.condition(state, stars);
		}).forEach(function (change) {
			change.apply(state, stars);
		});

		return state;
	}
}

module.exports = connector;