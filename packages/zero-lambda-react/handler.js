const http = require('http')
const renderer = require("./renderer")
const path = require("path")
const { resolve, parse, URL } = require('url')
const fetch = require('node-fetch')

var lambdaToPortMap = {}

const start = async (entryFilePath) => {
  if (lambdaToPortMap[entryFilePath]) return lambdaToPortMap[entryFilePath]
  if (!entryFilePath) throw new Error("No file provided.")
  const file = path.resolve(entryFilePath)
  // start a server on random port and bind to localhost
  const server = http.createServer((req, res)=>{
    renderer(req, res, file)
  })
  await server.listen(0, "127.0.0.1")
  console.log("listening react", server.address().port)
  lambdaToPortMap[entryFilePath] = server.address().port
  return server.address().port
}


module.exports = async (req, res, endpointData)=>{
  const port = await start(endpointData[1])
  // console.log("req", endpointData[1], port)
  const proxyRes = await fetch("http://127.0.0.1:"+port, {
    method: req.method,
    headers: Object.assign({ 'x-forwarded-host': req.headers.host }, req.headers),
    body: req.body,
    compress: false,
    redirect: 'manual'
  })

  // Forward status code
  res.statusCode = proxyRes.status

  // Forward headers
  const headers = proxyRes.headers.raw()
  for (const key of Object.keys(headers)) {
    res.setHeader(key, headers[key])
  }

  // Stream the proxy response
  proxyRes.body.pipe(res)
  proxyRes.body.on('error', (err) => {
    console.error(`Error on proxying url: ${newUrl}`)
    console.error(err.stack)
    res.end()
  })

  req.on('abort', () => {
    proxyRes.body.destroy()
  })
}
