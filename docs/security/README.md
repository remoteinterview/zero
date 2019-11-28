# Security

Zero introduces some new concepts like file-based routing and auto installation of `require`-d dependencies. This also means new attack vectors for hackers. Here are some recommendations:

## Running in Production-mode

When deploying to server, always prebuild your site with `zero build` and then run the server with `NODE_ENV=production` environment variable set. This turns off the development mode and doesn't automatically _execute_ any newly added files.

This will also turn off auto-dependency installation.

## Creating File Uploader

If your site needs a file uploading feature, ideally you should not store the file locally and directly `PUT` it to S3-like storage bucket. But if you are storing them locally, be sure to add that folder to `.zeroignore`.
