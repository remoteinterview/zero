const { get } = require("../request");
const cheerio = require("cheerio");

test(".MD File (Simple)", () => {
  //expect.assertions(1);
  return get("/mdx/heading").then(data => {
    const $ = cheerio.load(data);
    expect(
      $("body h1")
        .text()
        .trim()
    ).toBe("Heading");
  });
});

test(".MDX File (With .MD Import)", () => {
  //expect.assertions(1);
  return get("/mdx/withimport").then(data => {
    const $ = cheerio.load(data);
    expect(
      $("body h1")
        .text()
        .trim()
    ).toBe("Heading");
  });
});

test(".MDX File (With .JSX Import)", () => {
  //expect.assertions(1);
  return get("/mdx/withimportjsx").then(data => {
    const $ = cheerio.load(data);
    expect(
      $("body")
        .text()
        .trim()
    ).toBe("react-stateless");
  });
});

test(".MDX File (With Syntax Highlight)", () => {
  //expect.assertions(1);
  return get("/mdx/syntaxhighlight").then(data => {
    const $ = cheerio.load(data);
    expect($("pre").attr("class")).toBe("prism-code language-js");
  });
});
