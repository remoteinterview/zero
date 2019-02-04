import React from 'react'
import {Helmet} from "react-helmet";

module.exports = ({user}) => (
  <div>
    <Helmet>
        <title>Page Title</title>
        <link rel="canonical" href="http://mysite.com/example" />
    </Helmet>
  </div>
)