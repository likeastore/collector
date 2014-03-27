var request = require('request');
var moment = require('moment');
var util = require('util');

var scheduleTo = require('../scheduleTo');
var logger = require('./../../utils/logger');
var handleUnexpected = require('../handleUnexpected');
var config = require('../../../config');

var API = 'https://getpocket.com/v3/get';

function connector(state, user, callback) {
	var accessToken = state.accessToken;
	var log = logger.connector('pocket');

	if (!accessToken) {
		return callback('missing accessToken for user: ' + state.user);
	}

	initState(state);

	log.info('prepearing request in (' + state.mode + ') mode for user: ' + state.user);

	var body = formatRequestBody(accessToken, state);
	var headers = { 'Content-Type': 'application/json', 'User-Agent': 'likeastore/collector'};

	request.post({uri: API, headers: headers, timeout: config.collector.request.timeout, form: body}, function (err, response, body) {
		if (failed(err, response, body)) {
			return handleUnexpected(response, body, state, err, function (err) {
				callback (err, state);
			});
		}

		try {
			body = JSON.parse(body);
		} catch (e) {
			return handleUnexpected(response, body, state, e, function (err) {
				callback (err, state);
			});
		}

		return handleResponse(response, body);

	});

	function failed(err, response, body) {
		return err || response.statusCode !== 200 || !body;
	}

	function initState(state) {
		if (!state.mode) {
			state.mode = 'initial';
		}

		if (!state.errors) {
			state.errors = 0;
		}

		if (state.mode === 'initial' && !state.page) {
			state.page = 0;
		}

		if (state.mode === 'rateLimit') {
			state.mode = state.prevMode;
		}
	}

	function formatRequestBody(accessToken, state) {
		var pageSize = 500;

		var requestBody =  {
			consumer_key: config.services.pocket.consumerKey,
			access_token: accessToken,
			favorite: 1,
			detailType: 'complete',
			sort: 'oldest'
		};

		if (state.mode === 'initial') {
			requestBody.count = pageSize;
			requestBody.offset = pageSize * state.page;
		} else if (state.mode === 'normal') {
			requestBody.since = state.since;
		}

		return requestBody;
	}

	function handleResponse(response, body) {
		var rateLimit = +response.headers['x-limit-user-remaining'];
		log.info('rate limit remaining: ' +  rateLimit + ' for user: ' + state.user);

		var list = Object.keys(body.list).map(function (key) {
			return body.list[key];
		});

		if (!Array.isArray(list)) {
			return handleUnexpected(response, body, state, 'unexpected response', function (err) {
				callback(err, scheduleTo(updateState(state, body, [], rateLimit, true)));
			});
		}

		console.log(list);

		var stars = list.map(function (r) {
			return {
				itemId: r.item_id,
				idInt: +r.item_id,
				user: state.user,
				userData: user,
				title: r.resolved_title,
				authorName: r.authors && r.authors[0] && r.authors[0].name,
				authorUrl: r.authors && r.authors[0] && r.authors[0].url,
				source: r.resolved_url,
				created: moment.unix(r.time_favorited).toDate(),
				description: r.excerpt,
				thumbnail: r.image && r.image.src,
				type: 'pocket'
			};
		});

		log.info('retrieved ' + stars.length + ' stars for user: ' + state.user);

		return callback(null, scheduleTo(updateState(state, body, stars, rateLimit, false)), stars);
	}

	function updateState(state, body, data, rateLimit, failed) {
		state.lastExecution = moment().toDate();
		state.since = body.since;

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

module.exports = connector;