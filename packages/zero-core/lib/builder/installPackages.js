const konan = require('konan')
const fs = require("fs")
var glob = require("glob")
//var { spawnSync } = require("child_process")
const npminstall = require('npminstall');

async function getFiles(baseSrc) {
  return new Promise((resolve, reject)=>{
    glob(baseSrc + '/**/*', {nodir: true}, (err, res)=>{
      if (err) return reject(err)
      resolve(res)
    });
  })
}


async function installPackages(buildPath){
  buildPath = buildPath || process.cwd()
  const files = await getFiles(buildPath)

  // build a list of packages required by all js files
  var deps = []
  files.forEach(file => {
    if (file.endsWith(".js") || file.endsWith(".jsx")){
      var imports = konan(fs.readFileSync(file, 'utf8'))
      // only strings for now.
      imports.strings.forEach((imp)=> {
        // skip relative imports
        if (!imp.startsWith(".")) deps.push(imp)
      })
    }
  })

  deps = deps.filter(function(item, pos) {
    return deps.indexOf(item) == pos;
  })

  console.log("installing", deps)

  // now that we have a list. npm install them in our build folder
  // var out = spawnSync(`cd ${buildPath} && npm i ${deps.join(" ")}`)
  // console.log(out)

  await npminstall({
    debug: true,
    root: buildPath, 
    pkgs: deps.map((dep) => { return { name: dep, version: "*" } })
  })
}

module.exports = installPackages