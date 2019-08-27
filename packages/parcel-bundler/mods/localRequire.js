const { dirname } = require("path");
const { promisify } = require("@parcel/utils");
const resolve = promisify(require("resolve"));
const installPackage = require("./installPackage");
const getModuleParts = require("./getModuleParts");

const cache = new Map();
// const commonDeps = require(process.env.ZERO_COMMON_DEPS_PATH)
async function localRequire(name, path, triedInstall = false) {
  let [resolved] = await localResolve(name, path, triedInstall);
  return require(resolved);
}

async function localResolve(name, path, triedInstall = true) {
  let basedir = dirname(path);
  let key = basedir + ":" + name;
  let resolved = cache.get(key);
  if (!resolved) {
    try {
      try {
        resolved = await resolve(name, { basedir });
        // console.log('found', name, "in common deps")
      } catch (e) {
        resolved = await resolve(name, {
          basedir: process.env.ZERO_COMMON_DEPS_PATH
        });
        // console.log('found', name, "in user's deps")
      }
    } catch (e) {
      if (e.code === "MODULE_NOT_FOUND" && !triedInstall) {
        const packageName = getModuleParts(name)[0];
        await installPackage(packageName, path);
        return localResolve(name, path, true);
      }
      throw e;
    }
    cache.set(key, resolved);
  }

  return resolved;
}

localRequire.resolve = localResolve;
module.exports = localRequire;
