# Contributing to Zero

1. Fork this repository to your own GitHub account and then `git clone` it locally.
2. Run `npm install` in the root directory.
3. Run `npm run bootstrap` to link all the packages.

## Running Tests

Run `npm test` to run all tests.

## Running Server Without Tests

If you want to run server (on the test files) without running the test suite, you can do:
`node test/startServer.js`

## Debug Logs

Run zero with `DEBUG=core` to enable additional logging. Like:

```
DEBUG=core zero www
```

## Testing in your own app

Once you run `npm run bootstrap` in this repository's root, it should make `zero` command available to you system-wide. `cd` into your app's directory and just run `zero` to start the server.

## How Zero works.

Before you dive into the code, it's recommended that you read the [how it works](docs/howitworks.md) page.
