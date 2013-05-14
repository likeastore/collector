// http://stackoverflow.com/questions/16494663/rewrite-cycle-in-functional-style
function takeWhile(array, predicate) {
	var pos = -1;
	var all = array.every(function(x, n) {
		return (pos = n), predicate(x);
	});
	return array.slice(0, pos + all);
}

function dropWhile(array, predicate) {
	var pos = -1;
	var all = array.every(function(x, n) {
		return (pos = n), predicate(x);
	});
	return array.slice(pos + all);
}

// http://stackoverflow.com/questions/9717488/using-since-id-and-max-id-in-twitter-api
function decrementStringId (n) {
	n = n.toString();
	var result = n;
	var i = n.length-1;
	while (i > -1) {
		if (n[i] === '0') {
			result = result.substring(0, i) + '9' + result.substring(i + 1);
			i--;
		} else {
			result = result.substring(0, i) + (parseInt(n[i], 10) - 1).toString() + result.substring(i + 1);
			return result;
		}
	}
	return result;
}


module.exports = {
	takeWhile: takeWhile,
	dropWhile: dropWhile,
	decrementStringId: decrementStringId
};