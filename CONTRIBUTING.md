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

## How to sync latest changes in your local master branch
**Note:** If you have any outstanding Pull Request that you made from the `master` branch of your fork, you will lose them at the end of this step. You should ensure your pull request is merged by a moderator prior to performing this step. To avoid this scenario, you should *always* work on a branch separate from master.

**You can skip to step 4 if you already added upstream to main repository**

1.Change Directory to zero directory:
```sh
cd zero
```
2.Add a remote reference to the main zero repository:
```sh
git remote add upstream https://github.com/remoteinterview/zero.git
```

3.Ensure the configuration looks correct:

```sh
git remote -v
```
The output should look like:

```sh
origin    https://github.com/YOUR_USER_NAME/zero.git (fetch)
origin    https://github.com/YOUR_USER_NAME/zero.git (push)
upstream    https://github.com/remoteinterview/zero.git (fetch)
upstream    https://github.com/remoteinterview/zero.git (push)
```

4.Update your local copy of the zero upstream repository:
```sh
git fetch upstream
```

5.Hard reset your master branch with the zero master:

```sh
git reset --hard upstream/master
```

6.Push your master branch to your origin to have a clean history on your fork on GitHub:

```sh
git push origin master --force
```

7.You can validate your current master matches the upstream/master by performing a diff(Optional):

```sh
git diff upstream/master
```

The resulting output should be empty.