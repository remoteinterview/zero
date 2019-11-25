// generate a bundle of given entry file. We run this in a separate process as 'parcel-bundler' has problem running in parallel
//console.log("ARGV", require("../handlers")[process.argv[4]])
const map = require("zero-builders-map");
const bundler = map[process.argv[4]]
  ? require(map[process.argv[4]]).bundler
  : false;
if (bundler) {
  bundler(process.argv[3], process.argv[5], process.argv[2]).then(
    bundleInfo => {
      process.send(JSON.stringify(bundleInfo));
    }
  );
} else {
  process.send(false);
}
