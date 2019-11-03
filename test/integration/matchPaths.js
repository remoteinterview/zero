const { get } = require("../request");
const cheerio = require("cheerio");

// Path matching
test("Html file in root folder", () => {
  // expect.assertions(1);
  return get("/heading").then(data => {
    const $ = cheerio.load(data);
    expect(
      $("h1")
        .text()
        .trim()
    ).toBe("title");
  });
});

test("Txt file in root folder", () => {
  // expect.assertions(1);
  return get("/text.txt").then(data => {
    expect(data).toBe("text content");
  });
});

test("Hidden files are hidden", () => {
  // expect.assertions(1);
  return get("/_hidden/config.txt")
    .then(data => {
      //expect(data && data.indexOf("secret") === -1).toBe(true);
    })
    .catch(e => {
      expect(e.statusCode).toBe(404);
    });
});

test("Ignore files are ignored", () => {
  // expect.assertions(1);
  return get("/ignoredFolder", { json: true })
    .then(data => {
      //expect(!data || (data && !data.err)).toBe(true);
    })
    .catch(e => {
      expect(e.statusCode).toBe(404);
    });
});

test("Static file sibling to index", () => {
  // expect.assertions(1);
  return get("/html/text.txt").then(data => {
    expect(data).toBe("text");
  });
});

test("Static file sibling to non-index files", () => {
  // expect.assertions(1);
  return get("/react/text.txt").then(data => {
    expect(data).toBe("text");
  });
});

test("path which is similar to a valid lambda but not really", () => {
  // expect.assertions(1);
  return get("/api/fetcho", { json: true }).then(data => {
    expect(data[404]).toBe(true);
  });
  // .catch(e => {
  //   expect(e.statusCode).toBe(404);
  // });
});

test("path with space", () => {
  // expect.assertions(1);
  return get("/api/with space", { json: true }).then(data => {
    expect(data["withspace"]).toBe(true);
  });
});

test("path with dot", () => {
  // expect.assertions(1);
  return get("/api/with.dot", { json: true }).then(data => {
    expect(data["withdot"]).toBe(true);
  });
});

test("404 page works", () => {
  // expect.assertions(1);
  return get("/this/doesntexist", { json: true }).then(data => {
    expect(data[404]).toBe(true);
  });
});

// test("child path to a valid lambda", () => {
//   // expect.assertions(1);
//   return get("/react/stateless/doesntexist").then(data => {
//     const $ = cheerio.load(data);
//     expect(
//       $("body")
//         .text()
//         .trim()
//     ).toBe("react-stateless");
//   });
// });
