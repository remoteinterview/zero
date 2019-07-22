const { get } = require("../request");
// const cheerio = require("cheerio");

test("Proxy path index", () => {
  return get("/proxy", { json: true }).then(data => {
    expect(data.path).toBe("/proxy");
  });
});

test("Proxy sub-path", () => {
  return get("/proxy/abc", { json: true }).then(data => {
    expect(data.path).toBe("/proxy/abc");
  });
});

test("Fixed/Pinned path", () => {
  return get("/proxy/fixed", { json: true }).then(data => {
    expect(data.path).toBe("/fixedRoute");
  });
});
