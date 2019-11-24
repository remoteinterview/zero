// copy modified parcel files into their places.
const fs = require("fs"),
  path = require("path");
const mods = [
  // modify farm to never spawn a new process and just use localWorker
  ["@parcel/workers/src/WorkerFarm.js", "WorkerFarm.js"]
];

module.exports = () => {
  mods.forEach(mod => {
    fs.writeFileSync(
      require.resolve(mod[0]),
      fs.readFileSync(path.join(__dirname, "mods", mod[1]), "utf8"),
      "utf8"
    );
  });
};
