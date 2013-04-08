// just a temporary brainstorming code..

function execute() {
	var jobs = [{
		userId: 'a@a.com',
		connector: 'github',
		quotas: {
			requestPerMinute: 4
		}
	}, {
		userId: 'a@a.com',
		connector: 'twitter',
		quotas: {
			requestPerMinute: 1
		}
	}];

	executor.jobs(jobs, function (err, result) {
	});
}