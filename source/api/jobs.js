function jobsApi(app) {
	app.get('/api/jobs', function (req, res) {
		res.end();
	});

	app.get('/api/jobs/:userId', function (req, res) {
		res.end();
	});

	app.post('/api/jobs', function (req, res) {
		res.end();
	});
}


module.exports = jobsApi;