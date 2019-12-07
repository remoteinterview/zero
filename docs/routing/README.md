# Routing

## File-system Based Routing

Zero serves routes based on file structure. If you write a function that resides in `./api/login.js` it's exposed at `http://<SERVER>/api/login`. Similarly if you put a React page under `./about.jsx` it will be served at `http://<SERVER>/about`

## 404 Page

Create a `./404.js` file (or a `.jsx`, `.vue`, .`py`, etc) to catch all requests to pages that don't exist.

## Dynamic Routes (Pretty URL Slugs)

Zero decides routes based on file structure. Most projects also require dynamic routes like `/user/luke` and `/user/anakin`. Where `luke` and `anakin` are parameters. Zero natively supports this type of routes: any file or folder that **starts with \$** is considered a dynamic route.

So if you create `./user/$username.js` and then from browser visit `/user/luke`, Zero will send that request to `$username.js` file and set `req.params` to `{username: 'luke'}`. Code for this:

```js
/*
project/
└── user/
    └── $username.js <- this file
*/
module.exports = function(req, res) {
  console.log(req.params); // = {username: 'luke'} when user visits /user/luke
  res.send({ params: req.params });
};
```

Parameters apply to folder-names too. Another example: if you want to cater `/user/luke/messages` route, you can handle this with following directory structure:

```
project/
└── user/
    └── $username/
        └── index.js
        └── messages.js
```

- `index.js` handles `/user/:username` routes.
- `messages.js` handles `/user/:username/messages` routes.

**Tip:** `$` is used by Bash for variables. So it might be confusing when you do `cd $username` or `mkdir $username` and nothing happens. The right way to do this is escaping the `$` ie. `cd \$username` or `mkdir \$username`.

## Entry Point

By default, Zero compiles and serves all files in your project. As your project grows, you may want to organize them in one folder so that they don't mix with other config files. Zero lets you enter a main folder where it should get the routes.

Poject structure example:

```
project/
└── docs/
└── shared/
└── www/
    └── about.html
    └── index.js
└── data.js
```

Point the folder you want to expose:

```
zero www
```

Now only files inside the `www` folder will be served. Important to note they will be available at the root of the domain, like `http://<SERVER>/about`.

**Tip:** You can point multiple folders.

## .zeroignore file

You can also indicate specific files or folders to prevent them from being exposed.

Example, In a project with following structure:

```
project/
└── components/
└── api/
└── index.js
```

You probably don't want to expose `components` directory. To do this, create an `.zeroignore` file in the project root with the following text:

```
components
```

This will prevent your users from accessing `/components` path directly.

**Tip:** This file works just like [`.gitignore`](https://git-scm.com/docs/gitignore).
