import React from 'react'
import Heading from "./heading"
import {Helmet} from "react-helmet";

module.exports = ({user}) => (
  <div>
    <Helmet>
        <meta charSet="utf-8" />
        <title>Page Title</title>
        <link rel="canonical" href="http://mysite.com/example" />
    </Helmet>
    <Heading name={user? user.id: "World"}/>
  </div>
)