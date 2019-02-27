const konan = require('./getImports')
const path = require('path')
const fs = require('fs')
const builtInPackages = require('module').builtinModules || []

// recursively generate list of (relative) files imported by given file
function getRelativeFiles(file){
  const extension = path.extname(file)
  var deps = []
  if (!fs.existsSync(file, 'utf8')) return deps

  // js based files
  if (extension === ".js" || extension === ".jsx"
      || extension === ".md" || extension === ".mdx"){
    var imports = konan(file, fs.readFileSync(file, 'utf8'))
    // only strings for now.
    imports.strings.forEach((imp)=> {
      // skip package imports
      if (imp.startsWith(".")) {
        // some imports dont have extension. We got to handle those
        if (path.extname(imp)){
          deps.push(path.join(path.dirname(file), imp ))
        }
        else{
          var baseName = path.join(path.dirname(file), imp)
          if ( fs.existsSync( baseName + ".js") ) deps.push(baseName + ".js")
          else if ( fs.existsSync( baseName + ".jsx") ) deps.push(baseName + ".jsx")
          else if ( fs.existsSync( baseName + ".json") ) deps.push(baseName + ".json")
          else if ( fs.existsSync( baseName + ".md") ) deps.push(baseName + ".md")
          else if ( fs.existsSync( baseName + ".mdx") ) deps.push(baseName + ".mdx")
        }
      }
    })
  }
  deps.forEach((dep)=>{
    deps = deps.concat(getRelativeFiles( dep ))
  })
  return deps
}

function getPackages(file){
  var deps = []
  const extension = path.extname(file)
  if (extension === ".js" || extension === ".jsx"
  || extension === ".md" || extension === ".mdx"){
    var imports = konan(file, fs.readFileSync(file, 'utf8'))
    // only strings for now.
    imports.strings.forEach((imp)=> {
      imp = trimPackageName(imp);
      // skip relative imports and built-in imports (on newer node versions only)
      if (!imp.startsWith(".") && builtInPackages.indexOf(imp)===-1) {
        deps.push(imp)
      }
    })
  }

  return deps
}

// trim submodule imports to only install main package (ie. 'bootstrap' for: import 'bootstrap/dist/css/bootstrap.min.css')
// scoped package names are allowed to have one / - after that they will be trimmed as well
function trimPackageName(dep) {
  const regex =  /(@[^\/]*\/[^\/]*)?(^([^@][^\/]*)\/?)?/
  var matches = dep.match(regex);
  return matches[1] || matches[3];
}

module.exports = {
  getRelativeFiles: getRelativeFiles,
  getPackages: getPackages
}