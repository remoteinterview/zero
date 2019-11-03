// const {execSync} = require('child_process')
//const path = require('path')
const fs = require("fs");

// cleanup parcel postinstall msgs
try {
  var pkgPath = require.resolve("parcel-bundler/package.json");
  var pkg = require(pkgPath);
  delete pkg["scripts"]["postinstall"];
  fs.writeFileSync(pkgPath, JSON.stringify(pkg), "utf8");
} catch (e) {
  // do nothing
}

// cleanup core-js postinstall msgs
try {
  var corejsPath = require.resolve("core-js/postinstall");
  fs.writeFileSync(corejsPath, "", "utf8");
} catch (e) {
  // do nothing
}
