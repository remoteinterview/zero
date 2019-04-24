const path = require("path");
var isDev = process.env.NODE_ENV !== "production";
const crypto = require("crypto");
function sha1(data) {
  return crypto
    .createHash("sha1")
    .update(data, "binary")
    .digest("hex");
}

module.exports = async function bundle(entryFile, buildPath, publicPath) {
  const Bundler = require("parcel-bundler");
  buildPath = buildPath + "/_node"; // this causes router to not expose the bundle publicly
  var fullbuildPath = path.join(process.env.BUILDPATH, buildPath);

  const bundler = new Bundler(entryFile, {
    outDir: fullbuildPath,
    outFile: "index.js",
    publicUrl: "/" + buildPath,
    watch: !process.env.ISBUILDER,
    hmr: isDev && !process.env.ISBUILDER,
    logLevel: 2,
    target: "node",
    autoinstall: false,
    cacheDir: path.join(process.env.BUILDPATH, "_cache", sha1(entryFile)),
    cache: !process.env.ISBUILDER,
    minify: !isDev
  });

  const bundle = await bundler.bundle();
  return {
    js: path.join(buildPath, "/index.js")
  };
};
