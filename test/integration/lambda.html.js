const {get} = require("../request")
const cheerio = require('cheerio')

test('HTML (Simple)', () => {
  //expect.assertions(1);
  return get("/html").then(data => {
    const $ = cheerio.load(data)
    expect($('body h1').text().trim()).toBe("Title");
  });
});

test('HTML With SCSS Style', () => {
  //expect.assertions(1);
  return get("/html/withScriptAndStyle").then(data => {
    const $ = cheerio.load(data)
    expect($('[rel="stylesheet"]').attr('href').endsWith(".css")).toBe(true);
  });
});

test('HTML With Script', () => {
  //expect.assertions(1);
  return get("/html/withScriptAndStyle").then(data => {
    const $ = cheerio.load(data)
    expect($('script').attr('src').endsWith(".js")).toBe(true);
  });
});



// TODO: test html with script
// TODO: test html with css/scss
// TODO: test html path matching
