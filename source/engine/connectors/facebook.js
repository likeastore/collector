var request = require('request');
var logger = require('./../../utils/logger');
var moment = require('moment');
var util = require('util');
var scheduleTo = require('../scheduleTo');
var handleUnexpected = require('../handleUnexpected');
var helpers = require('../../utils/helpers');

var API = 'https://graph.facebook.com';
var FIELDS = 'links.fields(id,caption,from,icon,message,name,link,created_time,picture),likes.fields(link,name,website,description,id,created_time,picture),name,username';

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

	request({uri: uri, headers: headers, json: true}, function (err, response, body) {
		if (err) {
			return handleUnexpected(response, body, state, err, function (err) {
				callback (err, state);
			});
		}

		return handleResponse(response, body);
	});

	// TODO: move to common function, seems the same for all collectors?
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

	function formatRequestUri(accessToken, state) {
		var limit = 500;
		var base = util.format(
			'%s/me?fields=%s&access_token=%s&limit=%s', API, FIELDS, accessToken, limit);

		return state.mode === 'initial' || state.page ?
			util.format('%s&offset=%s', base, state.page * limit) :
			base;
	}

	function handleResponse(response, body) {
		var rateLimit = 100;
		log.info('rate limit remaining: ' +  rateLimit + ' for user: ' + state.user);

		var likesData = body.likes && body.likes.data;
		var linksData = body.links && body.links.data;
		var error = body.error;
		var authorName = body.username || body.name;

		if (!error && Array.isArray(likesData) && Array.isArray(linksData)) {
			var likes = likesData.map(function (r) {
				return {
					itemId: r.id.toString(),
					idInt: r.id,
					user: state.user,
					name: r.name,
					source: r.link,
					avatarUrl: r.picture.data.url,
					authorName: authorName,
					created: moment(r.created_time).toDate(),
					date: moment().toDate(),
					description: r.description || r.name,
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
					avatarUrl: r.picture,
					authorName: authorName,
					created: moment(r.created_time).toDate(),
					date: moment().toDate(),
					description: r.message || r.name,
					kind: 'link',
					type: 'facebook'
				};
			});

			likes = likes.concat(links);

			log.info('retrieved ' + likes.length + ' likes and links for user: ' + state.user);

			return callback(null, scheduleTo(updateState(state, likes, rateLimit)), likes);
		}

		handleUnexpected(response, body, state, error, function (err) {
			callback(err, scheduleTo(updateState(state, [], rateLimit)));
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