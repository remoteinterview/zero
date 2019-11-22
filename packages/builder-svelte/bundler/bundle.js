const fs = require("fs");
const path = require("path");
const debug = require("debug")("vue");
const mkdirp = require("mkdirp");
const crypto = require("crypto");
const ISDEV = process.env.NODE_ENV !== "production";
function sha1(data) {
  return crypto
    .createHash("sha1")
    .update(data, "binary")
    .digest("hex");
}

module.exports = async (filename, bundlePath, basePath, publicBundlePath) => {
  const Bundler = require("zero-parcel-bundler");
  mkdirp.sync(bundlePath);

  // we need a entry file
  var entryFileName = path.join(
    process.env.BUILDPATH,
    "/entry." + sha1(filename) + ".js"
  );
  const entry = createEntry(
    path.relative(path.dirname(entryFileName), filename)
  );
  // save entry code in a file and feed it to parcel
  fs.writeFileSync(entryFileName, entry, "utf8");

  // Bundler options
  const bundler = new Bundler(entryFileName, {
    outDir: bundlePath,
    outFile: "bundle.js",
    publicUrl: publicBundlePath,
    rootDir: process.env.SOURCEPATH,
    watch: !process.env.ISBUILDER,
    hmr: ISDEV && !process.env.ISBUILDER,
    logLevel: 2,
    target: "browser",
    cacheDir: path.join(
      require("os").tmpdir(),
      "zero",
      "cache",
      sha1(filename),
      "browser"
    ),
    cache: !process.env.ISBUILDER,
    minify: !ISDEV,
    autoinstall: false,
    sourceMaps: false //!ISDEV
  });

  process.on("SIGTERM", code => {
    bundler.stop();
    process.exit();
  });

  const bundle = await bundler.bundle();
  return bundle;
};

const createEntry = componentPath => {
  componentPath = componentPath.replace(/\\/g, "/"); // fix slashes for fwd on windows
  componentPath = componentPath.startsWith(".")
    ? componentPath
    : "./" + componentPath;
  return `
import App from "${componentPath}";

const target = document.getElementById("app");
let props = document.getElementById("props");
props = props.innerHTML;
props = JSON.parse(props);
const app = new App({ target, props, hydrate: true });
`;
};
