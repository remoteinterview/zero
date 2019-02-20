const React = require('react')

var _ = require('underscore');
var Component = require("./stateless")

const HelloWorld = props => {
  return (
    <React.Fragment>
      {_.reject([1, 2, 3, 4, 5, 6], (num) => num % 2 != 0)}
      <Component />
    </React.Fragment>
  )
}

module.exports =HelloWorld
