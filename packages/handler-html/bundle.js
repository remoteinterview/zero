const Bundler = require('parcel-bundler');
const path = require('path')
var isDev = process.env.NODE_ENV !== "production"
const crypto = require("crypto")
function sha1(data) {
    return crypto.createHash("sha1").update(data, "binary").digest("hex");
}

module.exports = async function bundle(entryFile, buildPath, publicPath){
  const bundler = new Bundler(entryFile, {
    outDir: buildPath,
    outFile: "index.html",
    publicUrl: publicPath,
    watch: true,
    hmr: isDev,
    logLevel: 2,
    cacheDir: path.join(process.env.BUILDPATH, "_cache", sha1(entryFile)),
    cache: true,
    minify: !isDev
  });

  const bundle = await bundler.bundle();
  return bundle
}