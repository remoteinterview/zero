# How Zero Works

## Overview
Zero Server is designed to be modular, so it can support other languages and frameworks in the future. To accomplish this, zero runs each "page" in it's own process and port. Zero then proxies HTTP requests to respective port based on path requested. Think of it as microservices but locally.

To explain this, let's consider the basic example: 

A project directory containing two files `index.jsx` and `time.js`. When you run `zero` in this directory, it does a few things on start:
- Copy all files to system's `tmp` folder. We will be modifying and adding more files to make the code work.

- Loop through all files in the folder and categorize them based on their extension to their respective handler type. Like `index.jsx` will be categorized as `react` type and `time.js` will be handled by `js`.

- For supported files (`js, jsx, md, mdx`), resolve their dependencies and install all `npm` packages. 

- Generate a map of all possible routes to their respective entry file. `/` will point to `./index.jsx` and `/time` to `./time.js`.
- Start the HTTP server.

After this, if you open the `http://localhost/time` in the browser, this happens inside zero:
- Check the lookup to find which entryfile corresponds to `/time` path.
- Check if a bundler is running for this file. If not, run the bundler and wait for it to build. The bundler can keep running to facilitate HMR or equivalent.
- Check if a server is running for this entryfile. If not, provide the entryfile to respective handler (in this case `handler-js`). The handler will start a new HTTP server in a new process and send back it's randomly chosen port back to zero's core.
- Once the 'child' server is running, zero will proxy the request to that server's port.
- Zero will keep this server running and save it's port for future requests.

All subsequent requests will be proxied to their respective port.