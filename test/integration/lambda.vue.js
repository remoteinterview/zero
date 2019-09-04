const { get } = require("../request");
const cheerio = require("cheerio");

// Vue Lambda
test("Vue Simple", () => {
  //expect.assertions(1);
  return get("/vue/hello").then(data => {
    const $ = cheerio.load(data);
    expect(
      $("body")
        .text()
        .trim()
    ).toBe("Hello World!");
  });
});

test("React With Imports", () => {
  //expect.assertions(1);
  return get("/vue/withimports").then(data => {
    const $ = cheerio.load(data);
    expect(
      $("body")
        .text()
        .trim()
    ).toBe("2, 4, 6");
  });
});

test("Vue With Head/Meta Tags", () => {
  //expect.assertions(1);
  return get("/vue/withhead").then(data => {
    const $ = cheerio.load(data);
    expect(
      $("head title")
        .text()
        .trim()
    ).toBe("My Title");
  });
});

test("Vue With asyncData", () => {
  //expect.assertions(1);
  return get("/vue/withAsyncData/?id=abc").then(data => {
    const $ = cheerio.load(data);
    expect(
      $("body")
        .text()
        .trim()
    ).toBe("abc");
  });
});
