/*
a wrapper around node-ignore with default ignores added.
zeroignore works on file-level and restricts exposing ignored files
from becoming lambdas/handlers or even static public files.

It works in two steps:
- When generating manifest, we ignore any source code that is ignored
from becoming a lambda
- When matching path, we prevent serving an ignored from as static.
*/

const nodeignore = require("ignore").default;
const path = require("path");
const fs = require("fs");
const DEFAULTIGNORES = [
  "_*",
  ".*",
  "package.json",
  "package-lock.json",
  "Dockerfile",
  "zero-deploy"
];

// keep global instance of zeroignore to avoid
// reading .zeroignore again and again
var zeroignore;

module.exports = () => {
  if (!zeroignore) {
    zeroignore = nodeignore();

    // add default ignores
    zeroignore.add(DEFAULTIGNORES);

    // read .zeroignore file if present
    var zeroignorePath = path.join(process.env.BUILDPATH, ".zeroignore");
    if (fs.existsSync(zeroignorePath)) {
      zeroignore.add(fs.readFileSync(zeroignorePath, "utf8"));
    }
  }

  return zeroignore;
};
