/*
a wrapper around node-ignore with default ignores added.
zeroignore works on file-level and restricts exposing ignored files
from becoming pages/handlers or even static public files.

It works in two steps:
- When generating manifest, we ignore any source code that is ignored
from becoming a page
- When matching path, we prevent serving an ignored from as static.
*/

const nodeignore = require("ignore").default;
const path = require("path");
const fs = require("fs");
const DEFAULTIGNORES = [
  // block all . files/folders
  ".*",
  // block all _ files
  "_*",
  "node_modules/*",
  "package.json",
  "package-lock.json",
  "Dockerfile",
  "requirements.txt",
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
    var zeroignorePath = path.join(process.env.SOURCEPATH, ".zeroignore");
    if (fs.existsSync(zeroignorePath)) {
      zeroignore.add(fs.readFileSync(zeroignorePath, "utf8"));
    }
  }

  return zeroignore;
};
