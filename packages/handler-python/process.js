const handler = require("./handler");

if (process.argv && process.argv.length === 8) {
  //start the process
  handler(
    process.argv[2],
    process.argv[3],
    process.argv[4],
    process.argv[5],
    process.argv[6],
    process.argv[7]
  );
}

// TODO: wrap in express app
module.exports = optionsArr => {
  return handler(
    optionsArr[0],
    optionsArr[1],
    optionsArr[2],
    optionsArr[3],
    optionsArr[4],
    optionsArr[5],
    true
  );
};
