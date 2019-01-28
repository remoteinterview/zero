const {get} = require("./request")
const cheerio = require('cheerio')

test('JS Lambda in root folder', () => {
  // expect.assertions(1);
  return get("/").then(data => {
    expect(data).toBe('Hello');
  });
});

test('Login and redirect', () => {
  // expect.assertions(1);
  return get("/api/login", {jar: true, json: true}).then(data => {
    expect(data.id).toBe('asad');
  });
});

test('React Stateless', () => {
  //expect.assertions(1);
  return get("/react/stateless").then(data => {
    const $ = cheerio.load(data)
    expect($('body').text().trim()).toBe("react-stateless");
  });
});

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