Collects the data from different sources.

## Installation and test

```
$ npm install
```

```
$ npm test
```

## Design

``Collector`` is job-driven engine that is able to connect to different API's (twitter, github, facebook etc.). Depends on API quota it performs the optimal number of calls, process the response data and store it generic form in database.

## Execution

``Collector`` works in deamon mode. It scans the subscribtion collections and making requests as long quota allows that.