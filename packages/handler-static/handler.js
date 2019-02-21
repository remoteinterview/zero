module.exports = (request, response, file) => {
  res.sendFile(path.join(process.env.BUILDPATH, file));
}