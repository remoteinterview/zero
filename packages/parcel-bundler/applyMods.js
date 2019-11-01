// copy modified parcel files into their places.
const fs = require("fs"),
  path = require("path");
const mods = [
  ["parcel-bundler/src/Resolver", "Resolver.js"],
  // modify localRequire to check commonDeps path too.
  ["parcel-bundler/src/utils/localRequire", "localRequire.js"],
  // modify babelrc to not install babel@core and infer version 7 already present.
  ["parcel-bundler/src/transforms/babel/babelrc", "babelrc.js"]
];

mods.forEach(mod => {
  fs.writeFileSync(
    require.resolve(mod[0]),
    fs.readFileSync(path.join(__dirname, "mods", mod[1]), "utf8"),
    "utf8"
  );
});

////
