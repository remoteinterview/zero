const jsprocess = require("zero-process")
const handler = require("./renderer")

//start the process
jsprocess(handler, process.argv[2], process.argv[3], process.argv[4], process.argv[5], process.argv[6], process.argv[7])