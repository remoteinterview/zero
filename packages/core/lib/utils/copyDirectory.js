// forked from https://github.com/zont/copy-and-watch/

const fs = require('fs');
const path = require('path');
const debug = require('debug')('core')
const glob = require('glob');
const createDirIfNotExist = require('./createDirIfNotExist');

module.exports = (from, to)=>{
  const copy = source => {
    // console.log("to", to)
    // console.log("from", from)
    // console.log("source", source)
    // console.log("relative", path.relative(from, source))
    const target = path.join(to, path.relative(from, source))
    // console.log("target", "target", "\n\n\n")
    createDirIfNotExist(target);
    const stats = fs.statSync(source);
    if (stats.isDirectory()) {
      return;
    }
    fs.writeFileSync(target, fs.readFileSync(source));
    debug('[COPY]'.yellow, source, 'to'.yellow, target);
  };

  glob.sync(path.join(from, "/**")).forEach(copy)
}