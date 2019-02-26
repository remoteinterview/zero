const path = require('path')
const url = require('url')
const express = require('express')

module.exports = (req, res)=>{
  const staticMiddleware = express.static(process.env.BUILDPATH)
  staticMiddleware(req, res, ()=>{
    res.sendStatus(404)
  })
}