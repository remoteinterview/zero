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

// with query param
test("Query Param", () => {
  return get("/python/queryparam?name=asad", {}).then(data => {
    expect(data).toBe("Hello, asad");
  });
});

test("POST (form data)", () => {
  // expect.assertions(1);

  return get("/python/postdata/", {
    method: "POST",
    formData: { email: "email@domain.com", password: "pass" }
  }).then(data => {
    expect(data).toBe(`Got email@domain.com`);
  });
});

test("CWD is correctly set", () => {
  return get("/python/cwd").then(data => {
    expect(data).toBe("some text");
  });
});
