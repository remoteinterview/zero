const path = require("path");
const jshandler = require(require("./").process);
jshandler([
  "/abc",
  require.resolve(path.join(__dirname, "../../test/www/python/withnumpy.py")),
  "lambda:python",
  "http://127.0.0.1:3001",
  __dirname,
  false
]).then(app => {
  app.listen(3001);
});
