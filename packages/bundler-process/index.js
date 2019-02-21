// generate a bundle of given entry file. We run this in a separate process as 'parcel-bundler' has problem running in parallel
//console.log("ARGV", require("../handlers")[process.argv[4]])
const bundler = require("zero-handlers-map")[process.argv[4]].bundler
if (bundler){
  bundler(process.argv[3], process.argv[5], process.argv[2]).then((bundleInfo)=>{
    process.send(JSON.stringify(bundleInfo))
  })  
}
else{
  process.send(false)
}
