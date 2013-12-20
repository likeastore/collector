var request = require('request');
var moment = require('moment');
var util = require('util');

var logger = require('../../utils/logger');
var scheduleTo = require('../scheduleTo');
var handleUnexpected = require('../handleUnexpected');
var config = require('../../../config');

var API = 'https://graph.facebook.com';
var FIELDS = 'links.limit(500).offset(%s).fields(id,caption,from,icon,message,name,link,created_time,picture),likes.limit(500).offset(%s).fields(link,name,website,description,id,created_time,picture),name,username';

function connector(state, callback) {
	var accessToken = state.accessToken;
	var log = logger.connector('facebook');

	if (!accessToken) {
		return callback('missing accessToken for user: ' + state.user);
	}

	initState(state);

	log.info('prepearing request in (' + state.mode + ') mode for user: ' + state.user);

	var uri = formatRequestUri(accessToken, state);
	var headers = { 'Content-Type': 'application/json', 'User-Agent': 'likeastore/collector'};

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

		if (state.mode === 'initial' && !state.page) {
			state.page = 0;
		}

		if (!state.errors) {
			state.errors = 0;
		}

		if (state.mode === 'rateLimit') {
			state.mode = state.prevMode;
		}
	}

	function formatRequestUri(accessToken, state) {
		var offset = state.mode === 'initial' ? state.page * 500 : 0;
		var fields = util.format(FIELDS, offset, offset);

		return util.format('%s/me?fields=%s&access_token=%s', API, fields, accessToken);
	}

	function formatDescription (message, name) {
		return message ? util.format('%s - %s', message, name) : name;
	}

	function handleResponse(response, body) {
		var likesData = body.likes && body.likes.data || [];
		var linksData = body.links && body.links.data || [];
		var error = body.error;
		var authorName = body.username || body.name;

		if (!error) {
			var likes = likesData.map(function (r) {
				return {
					itemId: r.id.toString(),
					idInt: r.id,
					user: state.user,
					name: r.name,
					source: r.link,
					avatarUrl: r.picture.data.url || 'https://www.gravatar.com/avatar?d=mm',
					authorName: authorName,
					created: moment(r.created_time).toDate(),
					description: formatDescription(r.description, r.name),
					kind: 'like',
					type: 'facebook'
				};
			});

			var links = linksData.map(function (r) {
				return {
					itemId: r.id.toString(),
					idInt: r.id,
					user: state.user,
					name: r.from.name,
					source: r.link,
					avatarUrl: r.picture || 'https://www.gravatar.com/avatar?d=mm',
					authorName: authorName,
					created: moment(r.created_time).toDate(),
					description: formatDescription(r.message, r.name),
					kind: 'link',
					type: 'facebook'
				};
			});

			likes = likes.concat(links);

			log.info('retrieved ' + likes.length + ' likes and links for user: ' + state.user);

			return callback(null, scheduleTo(updateState(state, likes, 9999)), likes);
		}

		handleUnexpected(response, body, state, error, function (err) {
			callback(err, state);
		});
	}

	function updateState(state, data, rateLimit) {
		state.lastExecution = moment().toDate();

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

		return state;
	}
}

module.exports = connector;