var respawn = require('respawn');
var util = require('util');

function monitor(mode) {
	var proc = respawn(['node', 'app.js', '--mode', mode], {
		cwd: '.',
		maxRestarts: 10,
		sleep: 1000,
	});

	proc.on('spawn', function () {
		util.print('application monitor started...');
	});

	proc.on('exit', function (code, signal) {
		util.print('process exited, code: ' + code + ' signal: ' + signal);
	});

	proc.on('stdout', function (data) {
		util.print(data.toString());
	});

	proc.on('stderr', function (data) {
		util.print(data.toString());
	});

	return proc;
}

[monitor('initial'), monitor('normal')].forEach(function (m) {
	m.start();
});

