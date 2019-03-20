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

test.only("React With Imports", () => {
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
/*
test("React With Custom Meta Charset", () => {
  //expect.assertions(1);
  return get("/vue/withcustomcharset").then(data => {
    const $ = cheerio.load(data);
    expect($("head [charset]").attr("charset")).toBe("ISO-8859-1");
  });
});

test("React With Default Meta Charset", () => {
  //expect.assertions(1);
  return get("/vue/withhelmet").then(data => {
    const $ = cheerio.load(data);
    expect($("head [charset]").attr("charset")).toBe("utf-8");
  });
});

test("React With getInitialProps", () => {
  //expect.assertions(1);
  return get("/vue/withInitialProps").then(data => {
    const $ = cheerio.load(data);
    expect(
      $("body")
        .text()
        .trim()
    ).toBe("2,4,6");
  });
});

test("React With SCSS Style", () => {
  //expect.assertions(1);
  return get("/vue/withStyle").then(data => {
    const $ = cheerio.load(data);
    expect(
      $('head [rel="stylesheet"]')
        .attr("href")
        .endsWith("bundle.css")
    ).toBe(true);
  });
});

test("React With Hooks", () => {
  //expect.assertions(1);
  return get("/vue/withHook").then(data => {
    const $ = cheerio.load(data);
    expect($("p").text()).toBe("You clicked 0 times");
  });
});

test("React With TypeScript", () => {
  //expect.assertions(1);
  return get("/vue/typescript").then(data => {
    const $ = cheerio.load(data);
    expect($("b").text()).toBe("Hello TypeScript");
  });
});

test("React With Class Properties", () => {
  //expect.assertions(1);
  return get("/vue/withClassProperties").then(data => {
    const $ = cheerio.load(data);
    expect($("button").text()).toBe("Click Me!");
  });
});

test("React With No Bundling", () => {
  //expect.assertions(1);
  return get("/vue/nobundling").then(data => {
    const $ = cheerio.load(data);
    expect($("script").length).toBe(0);
  });
});
*/
// TODO: test parcel output
