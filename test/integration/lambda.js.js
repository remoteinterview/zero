const {get} = require("../request")
const cheerio = require('cheerio')

// JS Lambda
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

test('Fetch (relative path)', () => {
  // expect.assertions(1);
  return get("/api/fetch", {jar: true, json: true}).then(data => {
    expect(data.evens[0]).toBe(2);
  });
});

test('Fetch (relative path)', () => {
  // depends on user being logged in (above)
  return get("/api/fetchWithCredentials", {jar: true, json: true}).then(data => {
    expect(data.id).toBe('asad');
  });
});


test('POST (json)', () => {
  // expect.assertions(1);
  const body = {a: 2}
  return get("/api/post", {
    jar: true, json: true, 
    method: "POST", 
    json: body
  }).then(data => {
    expect(data.body.a).toBe(2);
  });
});

test('API With TypeScript', () => {
  //expect.assertions(1);
  return get("/api/typescript").then(data => {
    expect(data).toBe('Hello TypeScript');
  });
});