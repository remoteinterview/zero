const { get } = require("../request");
const cheerio = require("cheerio");

// basic json response
test("Basic JSON Response", () => {
  return get("/python/basic", { json: true }).then(data => {
    expect(data.username).toBe("basic");
  });
});

// nested relative import
test("Nested Import", () => {
  return get("/python/nestedimport", { json: true }).then(data => {
    expect(data.username).toBe("basic");
  });
});

// with pip import (numpy)
test("Pip Module Import (Numpy)", () => {
  return get("/python/withnumpy", { json: true }).then(data => {
    expect(data.msg).toBe("numpy");
  });
});
