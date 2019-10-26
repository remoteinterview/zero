// forked from https://github.com/zont/copy-and-watch/

const fs = require("fs");
const path = require("path");
const debug = require("debug")("core");
const glob = require("fast-glob");
const mkdirp = require("mkdirp");

module.exports = (from, to) => {
  const copy = source => {
    const target = path.join(to, path.relative(from, source));
    mkdirp.sync(target);
    const stats = fs.statSync(source);
    if (stats.isDirectory()) {
      return;
    }
    fs.writeFileSync(target, fs.readFileSync(source));
    debug("[COPY]".yellow, source, "to".yellow, target);
  };

  glob.sync(path.join(from, "/**")).forEach(copy);
};
