const {get} = require("../request")
const cheerio = require('cheerio')

// React Lambda
test('React Stateless', () => {
  //expect.assertions(1);
  return get("/react/stateless").then(data => {
    const $ = cheerio.load(data)
    expect($('body').text().trim()).toBe("react-stateless");
  });
});


test('React With Imports', () => {
  //expect.assertions(1);
  return get("/react/withimports").then(data => {
    const $ = cheerio.load(data)
    expect($('body').text().trim()).toBe("246");
  });
});
