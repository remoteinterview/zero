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
  const Bundler = require("zero-parcel-bundler");
  buildPath = buildPath + "/html.static"; // this causes router to serve our html as static files
  var fullbuildPath = path.join(process.env.SOURCEPATH, buildPath);

  const bundler = new Bundler(entryFile, {
    outDir: fullbuildPath,
    outFile: "index.html",
    publicUrl: "/" + buildPath,
    rootDir: process.env.SOURCEPATH,
    watch: !process.env.ISBUILDER,
    hmr: isDev && !process.env.ISBUILDER,
    logLevel: 2,
    autoinstall: false,
    cacheDir: path.join(
      require("os").tmpdir(),
      "zero",
      "cache",
      sha1(entryFile)
    ),
    cache: !process.env.ISBUILDER,
    minify: !isDev
  });

  process.on("SIGTERM", code => {
    bundler.stop();
    process.exit();
  });

  await bundler.bundle();
  return {
    path: buildPath
  };
};
