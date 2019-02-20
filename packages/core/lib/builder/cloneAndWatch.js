// forked from https://github.com/zont/copy-and-watch/

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const glob = require('glob');
const globParent = require('glob-parent');
const del = require('del');
require('colors');
const debug = require('debug')('core')
const ISDEV = process.env.NODE_ENV!=="production"
const slash = require("../utils/fixPathSlashes")
module.exports = async (options, onWatchUpdate) => {
  var isWatching = false
  const target = options.target
  const sources = options.sources
  const parents = [...new Set(sources.map(globParent))];

  const findTarget = from => {
    from = slash(from)
    const parent = parents
      .filter(p => from.indexOf(p) >= 0)
      .sort()
      .reverse()[0];
    return path.join(target, path.relative(parent, from));
  };
  const createDirIfNotExist = to => {
    'use strict';

    const dirs = [];
    let dir = path.dirname(to);

    while (dir !== path.dirname(dir)) {
      dirs.unshift(dir);
      dir = path.dirname(dir);
    }

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
    });
  };
  const copy = from => {
    const to = findTarget(from);
    createDirIfNotExist(to);
    const stats = fs.statSync(from);
    if (stats.isDirectory()) {
      return;
    }
    fs.writeFileSync(to, fs.readFileSync(from));
    debug('[COPY]'.yellow, from, 'to'.yellow, to);
    if (isWatching && onWatchUpdate) onWatchUpdate('add', to) 
  };
  const remove = from => {
    const to = findTarget(from);
    try{
      fs.unlinkSync(to);
      debug('[DELETE]'.yellow, to);
      if (isWatching && onWatchUpdate) onWatchUpdate('remove', to)
    }
    catch(e){}

  };
  const rimraf = dir => {
    // don't remove node_modules
    if (dir.indexOf("node_modules")!==-1){
      return
    }
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(entry => {
        const entryPath = path.join(dir, entry);
        if (fs.lstatSync(entryPath).isDirectory()) {
          rimraf(entryPath);
        } else {
          fs.unlinkSync(entryPath);
        }
      });
      fs.rmdirSync(dir);
    }
  };

  // clean
  if (options.clean) {
    var paths = [
      path.join(target, "/**"), 
      '!' + target, 
      '!'+path.join(target, '/node_modules/**')
    ]
    // if running in prod mode, also avoid deleting builds.
    if (!ISDEV) paths.push('!'+path.join(target, '/zero-builds/**') )

    await del(paths, {force: true});
  }

  // initial copy
  sources.forEach(s => glob.sync(s).forEach(copy));

  if (onWatchUpdate) onWatchUpdate("ready")
  // watch
  if (options.watch) {
    // chokidar glob doesn't work with backward slashes
    chokidar.watch(sources.map((s)=>slash(s)), {
      ignoreInitial: true
    })
      .on('ready', () => { debug('[WATCHING]'.yellow, sources); isWatching = true })
      .on('add', copy)
      .on('addDir', copy)
      .on('change', copy)
      .on('unlink', remove)
      .on('unlinkDir', remove)
      .on('error', e => debug('[ERROR]'.red, e));
  }
}
