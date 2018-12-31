const konan = require('konan')
const fs = require("fs")
var glob = require("glob")
//var { spawnSync } = require("child_process")
const npminstall = require('npminstall');
var npmi = require('npmi');
var path = require('path');

async function getFiles(baseSrc) {
  return new Promise((resolve, reject)=>{
    glob(baseSrc + '/**/*', {nodir: true}, (err, res)=>{
      if (err) return reject(err)
      resolve(res)
    });
  })
}


async function installPackages(buildPath, manifest){
  buildPath = buildPath || process.cwd()
  var files = await getFiles(buildPath)
  files = files.filter((f)=>f.indexOf("node_modules")===-1)
  var deps = []

  // build a list of packages required by all js files
  files.forEach((file)=>{
    if (file.endsWith(".js") || file.endsWith(".jsx")){
      var imports = konan(fs.readFileSync(file, 'utf8'))
      // only strings for now.
      imports.strings.forEach((imp)=> {
        // trim submodule imports and install main package (ie. 'bootstrap' for: import 'bootstrap/dist/css/bootstrap.min.css')
        imp = imp.split("/")[0]
        // skip relative imports
        if (!imp.startsWith(".")) deps.push(imp)
      })
    }
  })
  
  // manifest.forEach(lambda => {
  //   const file = lambda[1]
  //   if (file.endsWith(".js") || file.endsWith(".jsx")){
  //     var imports = konan(fs.readFileSync(file, 'utf8'))
  //     // only strings for now.
  //     imports.strings.forEach((imp)=> {
  //       // skip relative imports
  //       if (!imp.startsWith(".")) deps.push(imp)
  //     })
  //   }
  // })

  deps = deps.filter(function(item, pos) {
    return deps.indexOf(item) == pos;
  })

  writePackageJSON(buildPath, deps)

  console.log("installing", deps)

  // now that we have a list. npm install them in our build folder
  // var out = spawnSync(`cd ${buildPath} && npm i ${deps.join(" ")}`)
  // console.log(out)

  var options = {
    path: buildPath,				// installation path [default: '.']
    npmLoad: {				// npm.load(options, callback): this is the "options" given to npm.load()
      loglevel: 'silent',	// [default: {loglevel: 'silent'}]
      progress: false
    }
  }
  npmi(options, function (err, result) {
    if (err) {
      if 		(err.code === npmi.LOAD_ERR) 	console.log('npm load error');
      else if (err.code === npmi.INSTALL_ERR) console.log('npm install error');
      return console.log(err.message);
    }
  
    // installed
    console.log('Pkgs installed successfully.');
  });
}

function writePackageJSON(buildPath, deps){
  // TODO: load package.json if already present at buildPath and use that as base.
  var json = {
    "name": "zeroapp",
    "private": true,
    "dependencies": {
      "react": "*",
      "react-dom": "*",
      "babel-core": "^6.26.0",
      "babel-plugin-add-module-exports": "^1.0.0",
      "babel-polyfill": "^6.26.0",
      "babel-preset-env": "^1.6.1",
      "babel-preset-react": "^6.24.1",
      "babel-preset-stage-0": "^6.24.1",
      "babel-plugin-transform-runtime": "^6.23.0",
      "babel-register": "^6.26.0",
      "browserify": "^14.5.0",
      "browserify-css": "^0.14.0",
      "babelify": "8"
    }
  }
  deps.forEach((dep)=>{
    json.dependencies[dep] = "*"
  })

  fs.writeFileSync(path.join(buildPath, "/package.json"), JSON.stringify(json), 'utf8')

  // // write .babelrc
  // var babeljson = {
  //   "plugins": ["babel-plugin-transform-runtime"]
  // }
  // fs.writeFileSync(path.join(buildPath, "/.babel.rc"), JSON.stringify(babeljson), 'utf8')
}

module.exports = installPackages