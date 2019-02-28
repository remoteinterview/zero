const path = require('path')
const fs = require('fs')

module.exports = to => {
  'use strict';

  const dirs = [];
  let dir = path.dirname(to);

  while (dir !== path.dirname(dir)) {
    dirs.unshift(dir);
    dir = path.dirname(dir);
  }

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  });
};