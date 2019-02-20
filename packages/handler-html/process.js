const jsprocess = require("zero-process")
const handler = require("./handler")

//start the process
jsprocess(handler, process.argv[2], process.argv[3], process.argv[4], process.argv[5], process.argv[6], process.argv[7])