# How Zero Works

## Overview

Zero Server is designed to be modular, so it can support other languages and frameworks in the future. To accomplish this, zero runs each "page" using the handler for that file's extension. Think of it as microservices but locally.

To explain this, let's consider the basic example:

A project directory containing two files `index.jsx` and `time.js`. When you run `zero` in this directory, it does a few things on start:

- Loop through all files in the folder and categorize them based on their extension to their respective handler type. Like `index.jsx` will be categorized as `react` type and `time.js` will be handled by `js`.

- For supported files (`js, jsx, md, mdx`), resolve their dependencies and install all `npm` packages.

- Generate a map of all possible page routes to their respective entry file. `/` will point to `./index.jsx` and `/time` to `./time.js`.
- Start the HTTP server.

After this, if you open the `http://localhost/time` in the browser, this happens inside zero:

- Check the lookup to find which file corresponds to `/time` path (so `time.js` in this case).
- Check if a builder is available to this type of page (in this case `js` pages are bundled using babel). If so, run the builder and wait for it to build. The builder can keep running to facilitate HMR or equivalent. The builder returns with information about the generated build.
- After this, load the relevant handler (in this case `handler-js`) and provide all page data and build info for this request.
