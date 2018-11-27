#!/usr/bin/env node

// check if the given module exports any endpoint handler
// only exits normally if a valid handler is present in the given file.
// we are doing this in a separate process to avoid crashing main builder.

var func = require( require("path").join(process.argv[2]) )  
if (!func || typeof func !== "function"){
  throw new Error("Not a handler.")
}
