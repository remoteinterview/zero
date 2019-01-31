const {get} = require("../request")
const cheerio = require('cheerio')

test('.MD File (Simple)', () => {
  //expect.assertions(1);
  return get("/mdx/heading").then(data => {
    const $ = cheerio.load(data)
    expect($('body h1').text().trim()).toBe("Heading");
  });
});

