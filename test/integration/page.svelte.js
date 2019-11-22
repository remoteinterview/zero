const { get } = require("../request");
const cheerio = require("cheerio");

test("Svelte with query param", () => {
  //expect.assertions(1);
  return get("/svelte/withQuery?name=Asad").then(data => {
    const $ = cheerio.load(data);
    expect(
      $("body h1")
        .text()
        .trim()
    ).toBe("Hello Asad");
  });
});

test("Svelte (nested) with query param", () => {
  //expect.assertions(1);
  return get("/svelte/withQuery?name=Asad").then(data => {
    const $ = cheerio.load(data);
    expect(
      $("body h1")
        .text()
        .trim()
    ).toBe("Hello Asad");
  });
});

test("Svelte With Head", () => {
  //expect.assertions(1);
  return get("/svelte/withhead").then(data => {
    const $ = cheerio.load(data);
    expect(
      $("head title")
        .text()
        .trim()
    ).toBe("Page Title");
  });
});

// test("Svelte With SCSS Style", () => {
//   //expect.assertions(1);
//   return get("/react/withStyle").then(data => {
//     const $ = cheerio.load(data);
//     expect(
//       $('head [rel="stylesheet"]')
//         .attr("href")
//         .endsWith("bundle.css")
//     ).toBe(true);
//   });
// });
