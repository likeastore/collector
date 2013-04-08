Collects the data from different sources.

## Installation and test

```bash
$ npm install
```

```bash
$ npm test
```

## Design

``Collector`` is job-driven engine that is able to connect to different API's (twitter, github, facebook etc.). Depends on API quota it performs the optimal number of calls, process the response data and store it generic form in database.

### Open API

``Collector`` exposes some API, so core application is able to create job for new user.

#### GET /api/jobs

Retrieves the list of currently active jobs.

#### GET /api/jobs/:userId

Retrieves the list of active jobs for user.

#### POST /api/jobs

Create a new job for user. Example of request,

```json
	{
		userId: 'smartypants@gmail.com',
		service: 'github',
		token: 'API_TOKEN'
	}
```

## Execution

``Collector`` works in deamon mode. It scans the jobs collection and making requests as long quota allows that.