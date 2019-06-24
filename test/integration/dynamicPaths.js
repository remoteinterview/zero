const { get } = require("../request");
// const cheerio = require("cheerio");

test("Dynamic in root", () => {
  return get("/rootdynamicpath", { json: true }).then(data => {
    expect(data.rootParam).toBe("rootdynamicpath");
  });
});

test("Non-dynamic index sibling", () => {
  return get("/dynamicpaths", { json: true }).then(data => {
    expect(data.index).toBe(true);
  });
});

test("Dynamic path with param", () => {
  return get("/dynamicpaths/param1", { json: true }).then(data => {
    expect(data.param).toBe("param1");
  });
});

test("Dynamic path's static sibling", () => {
  return get("/dynamicpaths/static", { json: true }).then(data => {
    expect(data.static).toBe(true);
  });
});

test("Dynamic path with param and nested index", () => {
  return get("/dynamicpaths/param1/nested", { json: true }).then(data => {
    expect(data.nestedIndex).toBe(true);
  });
});

test("Dynamic path with param and nested param", () => {
  return get("/dynamicpaths/param1/nested/nestedParam1", { json: true }).then(
    data => {
      expect(
        data.param === "param1" && data.nestedParam === "nestedParam1"
      ).toBe(true);
    }
  );
});

test("Dynamic path with param and nested param and a query", () => {
  return get("/dynamicpaths/param1/nested/nestedParam1?query=Query1", {
    json: true
  }).then(data => {
    expect(
      data.param === "param1" &&
        data.nestedParam === "nestedParam1" &&
        data.query === "Query1"
    ).toBe(true);
  });
});

test("Dynamic path with param and nested static as a sibling to nested param", () => {
  return get("/dynamicpaths/param1/nested/anotherStatic", { json: true }).then(
    data => {
      expect(data.anotherStatic).toBe(true);
    }
  );
});
