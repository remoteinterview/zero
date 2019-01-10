import React from 'react'
import Heading from "./heading"

module.exports = ({user}) => (
  <div>
    <title>React</title>
    <Heading name={user? user.id: "World"}/>
  </div>
)