var request = require('request');
var moment = require('moment');
var util = require('util');

var logger = require('../../utils/logger');
var scheduleTo = require('../scheduleTo');
var handleUnexpected = require('../handleUnexpected');
var config = require('../../../config');

var API = 'https://graph.facebook.com';
var FIELDS = 'links.limit(%s).offset(%s).fields(id,caption,from,icon,message,name,link,created_time,picture),likes.limit(%s).offset(%s).fields(link,name,website,description,id,created_time,picture.type(square)),name,username';

function connector(state, user, callback) {
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
		if (failed(err, response, body)) {
			return handleUnexpected(response, body, state, err, function (err) {
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
		var pageSize = state.mode === 'initial' ? 500 : 50;
		var offset = state.mode === 'initial' ? state.page * pageSize : 0;
		var fields = formatFields(pageSize, offset);

		return util.format('%s/me?fields=%s&access_token=%s', API, fields, accessToken);
	}

	function formatFields(pageSize, offset) {
		return util.format(FIELDS, pageSize, offset, pageSize, offset);
	}

	function formatDescription (message, name) {
		return message ? util.format('%s - %s', message, name) : name;
	}

	function handleResponse(response, body) {
		var likesData = body.likes && body.likes.data || [];
		var linksData = body.links && body.links.data || [];
		var error = body.error;
		var authorName = body.username || body.name;

		if (error) {
			return handleUnexpected(response, body, state, error, function (err) {
				callback(err, scheduleTo(updateState(state, [], 9999, true)));
			});
		}

		var likes = likesData.map(function (r) {
			return {
				itemId: r.id.toString(),
				idInt: r.id,
				user: state.user,
				userData: user,
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
				userData: user,
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

		return callback(null, scheduleTo(updateState(state, likes, 9999, false)), likes);
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
		}

		return state;
	}
}

module.exports = connector;