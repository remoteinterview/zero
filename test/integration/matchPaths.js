const {get} = require("../request")
const cheerio = require('cheerio')

// Path matching
test('Html file in root folder', () => {
  // expect.assertions(1);
  return get("/heading").then(data => {
    const $ = cheerio.load(data)
    expect($('h1').text().trim()).toBe("title");
  });
});

test('Txt file in root folder', () => {
  // expect.assertions(1);
  return get("/text.txt").then(data => {
    expect(data).toBe("text content");
  });
});