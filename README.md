# Collector

Collector is core component of current *Likeastore* architecture. It gathers application data through different open API's. Initially it was just dumb script of calling API wrappers, processing data and storing it to MongoDB, but after awhile it turned to be an interesting piece of code.

## You don't need API wrapper

The point is. In many cases of accessing some HTTP API you don't need any wrapper library. I personally was always looking for some ready to take wrapper, since I thought it would be easier. It still true, in some way. Now I see that all you actually need is [request](https://github.com/mikeal/request).

[request](https://github.com/mikeal/request) is brilliant library. It simplifies access to HTTP recourses, having very minimal and nice interface.

I'm not saying wrappers are wrong, but there are few problems with them, as for me:

* A lot of them (could be difficult to pick up)
* Not up to date (new version of API is out and previous in unsupported)
* Brings some overhead (you need to access few API method, but getting library)

So, in my case wrappers are wrong. Going with pure `request` object, was much more easier and fun.

## API's are different

API's differs from each other, especially in terms of authorization and rate limits.

We had to integrate 3 API: Github, Twitter, Google+. All of them claims OAuth support, but all of them implement it differently (bit differently).

Fortunately there are 2 things that come to help [passport](http://passportjs.org/) and.. again [request](https://github.com/mikeal/request). First helps OAuth integration and token retrieval, second has built-in OAuth support, so as you understood the meanings of all OAuth signature attributes, you can go.

## More than HTTP requests

All famous API are restrictive. Meant, all of them have *quotes* on a number of requests you can issue to HTTP for a given period of time. If you need to collect data for a bunch of users, you can easily overuse limits and be blocked. So, there should be a kind of scheduler that would respect quotes and do optimal number of calls.

Each *connector* is function with state. State contains information about current connector mode and data to access API optimally. The mode, is kind of knowledge that if connector is running *initially* it have to collect all possible data and after switch to *normal* mode and request the latest one.

## Basic pieces

So, collector contains of few pieces: `engine`, `tasksBuilder`, `connectors`, `stater` and few `utils`.

### Engine

[source/engine/index.js](source/engine/index.js) is the heart of collector. It creates a lists of *tasks* that have to be executed on next engine run, executes them and repeats.

It might sound as a simple task.. and it's quite simple. But in synchronous world, not asynchronous one.

In asynchronous world you could not run `while(true)` cycle and do some job inside. Node.js single threaded, event-log driven application, based on asynchronous IO. If you run `while(true)` you would simply consume all CPU, not allowing async operations to conclude.

["How to run infinite number of tasks in Node.js application?"](http://stackoverflow.com/questions/15886096/infinite-execution-of-tasks-for-nodejs-application]).

Stackoverflow, was helpful as usual. Very useful [answer](http://stackoverflow.com/a/15886384/386751) pointing to [async.queue](https://github.com/caolan/async/#queue). That's very powerful control flow algorithm. It allows to put array of tasks for execution, each are executing one-by-one and then eventing then all tasks are done. After that event you can run procedure again.

## Tasks builder

[source/engine/tasks/builder.js](source/engine/tasks/index.js) is the one that creates list of tasks. It knows about quotas. So, it tracks could the current task be run in exact type of moment or better to wait, to do not exceed rate limits.

It uses another great component, called [moment.js](http://momentjs.com/) - the best library to work with dates.

## Task

The actual task is [executor](/source/engine/connectors/factory.js) function. Executor owns the connector instance, reads it's state from db, runs it. After it updates the state (since connector changes it's state almost on each run) and storing the gathered data.

The useful library here [mongojs](https://github.com/gett/mongojs), simplifies MongoDB access as much as it's even possible.

## Connector

Each connector implement access to API. All of them has some aspects, briefly go through.

### Github API

[connectors/github.js](/source/engine/connectors/github.js) extracts all repositories starred by user.

To authorize, github provides `access_token`. `access_token` is received after user [approves](http://developer.github.com/v3/oauth/#web-application-flow) the access the application to users data. For github API all you need to do, just to add `access_token` as query parameter to request. Simple and easy.

Github API have paging and support hypermedia, response headers contains links for further recourse.

### Twitter API

[Twitter REST API](https://dev.twitter.com/docs/api) is truly powerful, but a bit harder to use.

First of all, it has very tough rate limits. Further more, it distinguish between 'user access API' and 'application access API' (or combination of 'application' the access on behalf of user).

As we need to collect data for a lot of users, 'application access API' would rather quickly go out of rates and `taskBuilder` would have to always wait.

[connector/twitter.js](/source/engine/connectors/twitter.js) implements access to Twitter API.

Instead of simple usage of token, twitter uses more complicated OAuth request [signature](https://dev.twitter.com/docs/auth/authorizing-request). I was very unsure who to generate one, but fortunately `request` supports OAuth [signature](https://github.com/mikeal/request#oauth-signing).

### Google+ API

[Google+ API](https://developers.google.com/+/api/) was next. We wanted to get posts used '+1ed'.

Very quickly it became obvious, that it is not possible. Google+ simple does not provide API for that.

That's a shame and that was the reason to drop [connectors/googleplus.js](/source/engine/connectors/googleplus.js).

Tried to find a replacement for that service. And the answer was really close - [stackoverflow.com](http://stackoverflow.com/) is the place where questions and [favorites](http://stackoverflow.com/users/386751/alexanderb?tab=favorites) born, and keeping track on them is good idea for product.

### Stackoverflow API

[Stackoverflow API](http://api.stackoverflow.com/1.0/usage) appeared to be as good as Github one. OAuth support, but without OAuth signature, easy register of application etc.

[connector/stackoverflow.js](/source/engine/connectors/stackoverflow.js) implements access to Stackoverlow.

Documentation is nice, I quickly found the way to access users favorites. But, I was really suprised that I issued HTTP request and got response.

```
Additionally, all API responses are GZIP'd. The Content-Encoding header is always set, but some proxies will strip this out. The proper way to decode API responses can be found here.
```

Everything is GZIP'd.

This time `request.js` did not appear as magic stick. It did not provide gzip support from the box. Fortunately, I found this [blog post](http://apptakk.blogspot.com/2012/05/handling-gzip-encoded-http-responses-in.html). Using of MemoryStream worked really nice, I was able to decompress requests and read data from it.

## Stater

[source/utils/stater.js](/source/utils/stater.js) is utility to move connector from one state to another. It uses the list of `stateChages` which contains the function of checking state change condition and actual change functor.

## Utils

[source/utils/logger.js](/source/utils/logger.js) will help you for logging different application activities. To make it more readable from console, it uses [colors](https://github.com/marak/colors.js/) library.

For logging connectors stuff, you can use special factory method:

```js
var log = logger.connector('github');
log.info('retrieved ' + data.length + ' stars');
```

It also contains few functions that I used from SO answers (links are inside). One that helped me to substite ugly-looking `for-cycle` another one that helps to head with Twitter API ids [problem](http://stackoverflow.com/questions/9717488/using-since-id-and-max-id-in-twitter-api) in JavaScript.

## Tests

All (almost all) aspects of `collectors` functionality are covered by [unit tests](/test).

There are few things that helped me to create those tests. I use [Mocha](https://github.com/visionmedia/mocha) as primary test framework, to run the tests:

```
$ mocha
```

Connectors are issuing HTTP request and unit tests have to mock it. [Nock](https://github.com/flatiron/nock) is a simple and nice library for that. Good thing is that's possible to read response content from files. All tests responses are placed in [/test/replies](/test/replies) folder. To mock HTTP request,

```js
beforeEach(function (done) {
	nock('http://api.stackoverflow.com')
		.get('/1.1/users/12345/favorites?access_token=fakeToken&pagesize=100&sort=creation&page=1')
		.replyWithFile(200, __dirname + '/replies/stackoverflow.connector.init.json.gz');

	connector(state, function (err, state, favorites) {
		updatedState = state;
		returnedFavorites = favorites;

		done();
	});
});
```

Some modules, as connector or task builder are using logger inside. If you run the test the output would be polluted with non-required logs. Traditionally, it is solved by injection the dependency in module and being able to substitute with stub. [Rewire](https://github.com/jhnns/rewire) is a module to help.

All connectors tests are stubbing logger,

```js
beforeEach(function () {
	connector = rewire('./../source/engine/connectors/stackoverflow');
	connector.__set__('logger', loggerFake);
});
```

# License

MIT License