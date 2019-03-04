const getPackages = require('zero-dep-tree-js').getPackages
const fs = require("fs")
var glob = require("glob")
//var { spawnSync } = require("child_process")
//const npminstall = require('npminstall');
var npmi = require('npmi');
// const pnpm = require('pnpm/lib/main').default
var path = require('path');
const debug = require('debug')('core')

const babelConfig = {
  "plugins": [
    ["@babel/plugin-transform-runtime"]
  ]
}

async function getFiles(baseSrc) {
  return new Promise((resolve, reject)=>{
    glob(baseSrc + '/**/*', {nodir: true}, (err, res)=>{
      if (err) return reject(err)
      resolve(res)
    });
  })
}


function installPackages(buildPath, filterFiles){
  return new Promise(async (resolve, reject)=>{
    var files = await getFiles(buildPath)
    files = files.filter((f)=>{
      f = path.relative(process.env.BUILDPATH, f)
      return f.indexOf("node_modules")===-1 && f.indexOf("zero-builds")===-1
    })
    // debug("files", files)
    var deps = []

    // build a list of packages required by all js files
    files.forEach((file)=>{
      if (filterFiles && filterFiles.length>0 && filterFiles.indexOf(file)===-1) {
        debug("konan skip", file)
        return
      }

      deps = deps.concat(getPackages(file))
    })

    deps = deps.filter(function(item, pos) {
      return deps.indexOf(item) == pos;
    })

    // check if these deps are already installed
    var pkgjsonPath = path.join(buildPath, "/package.json")
    var allInstalled = false
    if (fs.existsSync(pkgjsonPath)){
      try{
        var pkg = require(pkgjsonPath)
        allInstalled = true // we assume all is installed
        deps.forEach((dep)=>{
          if (!pkg || !pkg.dependencies || !pkg.dependencies[dep]){
            allInstalled = false //didn't find this dep in there.
          }
        })
      }
      catch(e){

      }
    }
    if (!allInstalled) {
      // now that we have a list. npm install them in our build folder
      writePackageJSON(buildPath, deps)
      debug("installing", deps)

      var options = {
        path: buildPath,				// installation path [default: '.']
        npmLoad: {				// npm.load(options, callback): this is the "options" given to npm.load()
          //loglevel: 'silent',	// [default: {loglevel: 'silent'}]
          progress: false
        }
      }
      npmi(options, function (err, result) {
        if (err) {
          if 		(err.code === npmi.LOAD_ERR) 	debug('npm load error');
          else if (err.code === npmi.INSTALL_ERR) debug('npm install error');
          reject(err)
          return debug("errr", err.message);
        }
      
        // installed
        debug('Pkgs installed successfully.');
        resolve()
      });

      // try{
      //   await pnpm(["install", "--loglevel", "warn", "--prefix", buildPath])
      //   // installed
      //   debug('Pkgs installed successfully.');
      //   resolve()
        
      // }
      // catch(e){
      //   reject(e)
      // }
    }
    else{
      resolve()
    }
  })
  
}

function writePackageJSON(buildPath, deps){
  // first load current package.json if present
  var pkgjsonPath = path.join(buildPath, "/package.json")
  var pkg = {
    "name": "zeroapp",
    "private": true,
    "dependencies": {}
  }
  if (fs.existsSync(pkgjsonPath)){
    try{
      pkg = require(pkgjsonPath)
    }
    catch(e){}
  }

  // the base packages required by zero
  var depsJson = {
    "react": "^16.8.1",
    "react-dom": "^16.8.1",
    // "babel-core": "^6.26.0",
    // "babel-polyfill": "^6.26.0",
    //"babel-loader": "^7.1.5",
    "react-helmet": "^5.2.0",
    // "@babel/polyfill": "^7.2.5",
    "@babel/runtime": "^7.3.1",
    "regenerator-runtime": "^0.12.0",

    "sass": "^1.17.2",
    "postcss-modules":"1.4.1",
    "cssnano": "4.1.10",

    "react-hot-loader": "^4.6.5",
    // "object-assign":"^4.1.1", 
    // "prop-types":"^15.7.2", 
    // "scheduler":"^0.13.3",
    
    "@mdx-js/tag": "^0.16.8",
    "@babel/plugin-transform-runtime": "^7.2.0",
    "@babel/core": "^7.2.2",
    // "@babel/core": "^7.2.2",
    
    // "babel-loader": "^8.0.5",
    // "css-loader": "2.1.0",
    // "file-loader": "3.0.1",
    // "node-sass": "4.11.0",
    // "sass-loader": "7.1.0",
    // "style-loader": "0.23.1",
    // "url-loader": "1.1.2",
    // "mini-css-extract-plugin": "^0.5.0",
    // "@mdx-js/loader": "^0.16.8"
  }

  if (pkg.dependencies){
    Object.keys(depsJson).forEach((key)=>{
      pkg.dependencies[key] = depsJson[key]
    })
  }
  else{
    pkg.dependencies = depsJson
  }

  // append user's imported packages (only if not already defined in package.json)
  deps.forEach((dep)=>{
    if (!pkg.dependencies[dep]) pkg.dependencies[dep] = "*"
  })

  fs.writeFileSync(path.join(buildPath, "/package.json"), JSON.stringify(pkg), 'utf8')

  // // write .babelrc
  fs.writeFileSync(path.join(buildPath, "/.babelrc"), JSON.stringify(babelConfig), 'utf8')
}

module.exports = installPackages