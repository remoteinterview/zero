const http = require('http')
const renderer = require("./renderer")
const path = require("path")

const start = async () => {
  if (!process.argv[2]) throw new Error("No file provided.")
  const file = path.resolve(process.argv[2])
  // start a server on random port and bind to localhost
  const server = http.createServer((req, res)=>{
    renderer(req, res, file)
  })
  await server.listen(0, "127.0.0.1")
  console.log("listening", server.address().port)
  return server.address().port
}

start()