var get = require("./request")

test('Root lambda is working', () => {
  expect.assertions(1);
  return get("/").then(data => {
    expect(data).toBe('Hello');
  });
});