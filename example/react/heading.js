const React = require("react")
var props = {b:9}
var a = {...props, a:8}
module.exports = ({name}) => (
  <h1>Hello {name} {a.b}</h1>
)