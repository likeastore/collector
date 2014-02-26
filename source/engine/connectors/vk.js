var _ = require('underscore');
var async = require('async');
var request = require('request');
var moment = require('moment');
var util = require('util');

var scheduleTo = require('../scheduleTo');
var logger = require('./../../utils/logger');
var handleUnexpected = require('../handleUnexpected');
var config = require('../../../config');

var API = 'https://api.vk.com';

function connector(state, user, callback) {
	async.series([posts], function (err, results) {
		if (err) {
			return callback(err, state);
		}

		return callback(null, state, _.flatten(results));
	});

	function posts(callback) {
		var accessToken = state.accessToken;
		var log = logger.connector('github');

		if (!accessToken) {
			return callback('missing accessToken for user: ' + state.user);
		}

		initState(state);

		log.info('prepearing request in (' + state.mode + ') mode for user: ' + state.user);

		var uri = formatRequestUri(accessToken, state);
		var headers = { 'Content-Type': 'application/json', 'User-Agent': 'likeastore/collector'};

		console.log(uri);

		request({uri: uri, headers: headers, timeout: config.collector.request.timeout, json: true}, function (err, response, body) {
			if (err) {
				return handleUnexpected(response, body, state, err, function (err) {
					callback (err, state);
				});
			}

			return handleResponse(response, body);
		});

		function initState(state) {
			if (!state.mode) {
				state.mode = 'initial';
			}

			if (!state.errors) {
				state.errors = 0;
			}

			if (state.mode === 'initial' && !state.postsPage) {
				state.postsPage = 0;
			}

			if (state.mode === 'rateLimit') {
				state.mode = state.prevMode;
			}
		}

		function formatRequestUri(accessToken, state) {
			var pageSize = state.mode === 'initial' ? 100 : 50;
			var base = util.format('%s/method/fave.getPosts?count=%s', API, pageSize);
			var url = state.mode === 'initial' || state.postsPage ?
				util.format('%s&offset=%s', base, state.postsPage * pageSize) :
				base;

			return util.format('%s&access_token=%s', url, accessToken);
		}

		function handleResponse(response, body) {
			console.dir(body);

			// var rateLimit = +response.headers['x-ratelimit-remaining'];
			// log.info('rate limit remaining: ' +  rateLimit + ' for user: ' + state.user);

			// if (!Array.isArray(body)) {
			// 	return handleUnexpected(response, body, state, function (err) {
			// 		callback(err, scheduleTo(updateState(state, [], rateLimit, true)));
			// 	});
			// }

			// var stars = body.map(function (r) {
			// 	return {
			// 		itemId: r.id.toString(),
			// 		idInt: r.id,
			// 		user: state.user,
			// 		userData: user,
			// 		name: r.full_name,
			// 		repo: r.name,
			// 		authorName: r.owner.login,
			// 		authorUrl: r.owner.html_url,
			// 		authorGravatar: r.owner.gravatar_id,
			// 		avatarUrl: 'https://www.gravatar.com/avatar/' + r.owner.gravatar_id + '?d=mm',
			// 		source: r.html_url,
			// 		created: moment(r.created_at).toDate(),
			// 		description: r.description,
			// 		type: 'github'
			// 	};
			// });

			// log.info('retrieved ' + stars.length + ' stars for user: ' + state.user);

			return callback(null, scheduleTo(updateState(state, [], 9999, false)), null);
		}

		function updateState(state, data, rateLimit, failed) {
			state.lastExecution = moment().toDate();

			if (!failed) {
				if (state.mode === 'initial' && data.length > 0) {
					state.page += 1;
				}

				if (state.mode === 'initial' && data.length === 0) {
					state.mode = 'normal';
					delete state.page;
				}

				if (rateLimit <= 1) {
					var currentState = state.mode;
					state.mode = 'rateLimit';
					state.prevMode = currentState;
				}
			}

			return state;
		}
	}
}

module.exports = connector;