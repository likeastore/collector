function createForJob(job) {
	return {
		run: function (callback) {
			return callback(null, {summary: 'Nothing executed for job'});
		}
	};
}

module.exports = {
	createForJob: createForJob
};