# Deployment

A Zero app is a regular Node.js server. You should `zero build` your project in your build step (after `npm install` or `yarn` step): Here is an example `package.json`:

```json
{
  "name": "my-zero-app",
  "scripts": {
    "dev": "zero",
    "build": "zero build",
    "start": "NODE_ENV=production zero"
  },
  "dependencies": {
    "zero": "latest"
  }
}
```

- We add dependency `zero`, so the cloud builder can install `zero` on your server.
- Add a `"start"` command and also set `NODE_ENV` to `production` so zero generates minified builds and disabled HMR etc.
- Add a `"build"` command to pre-build all files to speed up cold boots. Don't forget to run `npm run build` in your build step (in your Dockerfile, `heroku-postbuild`, etc)
- If your cloud has an option to set environment variables / config variables (to store secrets, API keys, etc), these variables are automatically passed to your code and can be accessed as you normally would. In node, using `process.env.MY_SECRET`. You should never commit your local `.env` file to your code.

After this, you can follow the instructions from your cloud provider for deploying a Node.js app.

## Heroku Buildpack

We provide an official [Buildpack for Heroku](https://github.com/remoteinterview/zero-heroku-buildpack). If you are deploying on Heroku, this is the easiest way.

## Changing Server's Port

By default zero runs on port `3000`. You can change this by setting the `PORT` environment variable, like this: `PORT=8080 zero`

## Running with Docker

Here is a basic `Dockerfile` you can add to your zero application to Docker-ize it:

```dockerfile
FROM node:alpine


# Install dependencies via apk
RUN apk update && apk upgrade \
    && apk add --no-cache python python3 g++ make \
    && rm -rf /var/cache/apk/*

# Install zero globally
RUN npm install --quiet --no-progress --unsafe-perm -g zero

# Add current folder to /app
ADD . /app

# Run zero in production mode
ENV NODE_ENV production

# Generate bundles
RUN zero build

# Expose port
ENV PORT 80
EXPOSE 80

WORKDIR /app

CMD ["zero"]
```
