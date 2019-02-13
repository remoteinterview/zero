const Bundler = require('parcel-bundler');
const path = require('path')
var isDev = process.env.NODE_ENV !== "production"
module.exports = async function bundle(entryFile, buildPath, publicPath){
  const bundler = new Bundler(entryFile, {
    outDir: buildPath,
    outFile: "index.html",
    publicUrl: publicPath,
    watch: true,
    hmr: isDev,
    logLevel: 2,
    cache: false,
    minify: !isDev
  });

  const bundle = await bundler.bundle();
  return bundle
}