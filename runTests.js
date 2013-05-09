var mocha = require('child_process').exec('mocha --growl');
mocha.stdout.on('data', function (data) {
	console.log('' + data);
});
mocha.stderr.on('data', function (data) {
	console.log('' + data);
});
mocha.on('close', function (code) {
	console.log('mocha suited finished with code: ' + code);
});
