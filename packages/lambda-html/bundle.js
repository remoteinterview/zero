const Bundler = require('parcel-bundler');
const path = require('path')

module.exports = async function bundle(entryFile, buildPath, publicPath){
  const bundler = new Bundler(entryFile, {
    outDir: buildPath,
    outFile: "index.html",
    publicUrl: publicPath,
    watch: false,
    logLevel: 2,
    cache: false,
    minify: process.env.NODE_ENV === "production"
  });

  const bundle = await bundler.bundle();
  return bundle
}