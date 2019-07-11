const crypto = require("crypto");
const fs = require("fs");
const sha1 = path =>
  new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha1");
    const rs = fs.createReadStream(path);
    rs.on("error", reject);
    rs.on("data", chunk => hash.update(chunk));
    rs.on("end", () => resolve(hash.digest("hex")));
  });

module.exports = sha1;
