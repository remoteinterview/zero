const { get } = require("../request");
var CODES = require("./hmr.codes");
const fs = require("fs");
const path = require("path");
const isWin = process.platform === "win32";

function makePath(file) {
  return path.join(__dirname, "..", "www", "hmr", file);
}

function writeFile(file, data) {
  fs.writeFileSync(makePath(file), data, "utf8");
  return new Promise((resolve, reject) => {
    // wait a bit for zero to be ready
    // TODO: When zero has an eventemitter feature, wait for 'ready' instead.
    setTimeout(() => {
      resolve();
    }, process.env.HMRWAITTIME || 3000);
  });
}

test("JS HMR (add a new handler and modify it)", async () => {
  expect.assertions(2);
  await writeFile("index.js", CODES["js"]);
  return get("/hmr").then(async data => {
    expect(data).toBe("Hello");
    await writeFile("index.js", CODES["js"].replace("Hello", "Hey"));
    return get("/hmr").then(data => {
      expect(data).toBe("Hey");
    });
  });
});

test("React HMR (add a new handler and modify it)", async () => {
  expect.assertions(2);
  await writeFile("react.jsx", CODES["react"]);
  return get("/hmr/react").then(async data => {
    expect(data).toContain("Hello React");
    await writeFile("react.jsx", CODES["react"].replace("Hello", "Hey"));
    return get("/hmr/react").then(data => {
      expect(data).toContain("Hey React");
    });
  });
});

// This case is flaky on windows CI somehow but works on actual machine, so skip it.
if (!isWin) {
  test("HTML HMR (add a new handler and modify it)", async () => {
    expect.assertions(2);
    await writeFile("html.html", CODES["html"]);
    return get("/hmr/html").then(async data => {
      expect(data).toContain("Hello HTML");
      await writeFile("html.html", CODES["html"].replace("Hello", "Hey"));
      return get("/hmr/html").then(data => {
        expect(data).toContain("Hey HTML");
      });
    });
  });
}

test("MDX HMR (add a new handler and modify it)", async () => {
  expect.assertions(2);
  await writeFile("mdx.mdx", CODES["mdx"]);
  return get("/hmr/mdx").then(async data => {
    expect(data).toContain("Hello MDX");
    await writeFile("mdx.mdx", CODES["mdx"].replace("Hello", "Hey"));
    return get("/hmr/mdx").then(data => {
      expect(data).toContain("Hey MDX");
    });
  });
});

test("Python HMR (add a new handler and modify it)", async () => {
  expect.assertions(2);
  await writeFile("python.py", CODES["python"]);
  return get("/hmr/python").then(async data => {
    expect(data).toContain("Hello Python");
    await writeFile("python.py", CODES["python"].replace("Hello", "Hey"));
    return get("/hmr/python").then(data => {
      expect(data).toContain("Hey Python");
    });
  });
});

test("Vue HMR (add a new handler and modify it)", async () => {
  expect.assertions(2);
  await writeFile("vue.vue", CODES["vue"]);
  return get("/hmr/vue").then(async data => {
    expect(data).toContain("Hello Vue");
    await writeFile("vue.vue", CODES["vue"].replace("Hello", "Hey"));
    return get("/hmr/vue").then(data => {
      expect(data).toContain("Hey Vue");
    });
  });
});

test("Proxy HMR (add a new handler and modify it)", async () => {
  expect.assertions(2);
  await writeFile("proxy.json", CODES["proxy"]);
  return get("/hmr/proxy", { json: true }).then(async data => {
    expect(data.path).toBe("/path1");
    await writeFile("proxy.json", CODES["proxy"].replace("/path1", "/path2"));
    return get("/hmr/proxy", { json: true }).then(data => {
      expect(data.path).toBe("/path2");
    });
  });
});

test("Svelte HMR (add a new handler and modify it)", async () => {
  expect.assertions(2);
  await writeFile("svelte.svelte", CODES["svelte"]);
  return get("/hmr/svelte").then(async data => {
    expect(data).toContain("Hello Svelte");
    await writeFile("svelte.svelte", CODES["svelte"].replace("Hello", "Hey"));
    return get("/hmr/svelte").then(data => {
      expect(data).toContain("Hey Svelte");
    });
  });
});
