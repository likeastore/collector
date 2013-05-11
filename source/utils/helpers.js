function takeWhile(array, predicate) {
	var pos = -1;
	var all = array.every(function(x, n) {
		return (pos = n), predicate(x);
	})
	return array.slice(0, pos + all);
}

function dropWhile(array, predicate) {
	var pos = -1;
	var all = array.every(function(x, n) {
		return (pos = n), predicate(x);
	})
	return array.slice(pos + all);
}

module.exports = {
	takeWhile: takeWhile,
	dropWhile: dropWhile
}