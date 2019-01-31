const {get} = require("../request")
const cheerio = require('cheerio')

// React Lambda
test('React Stateless', () => {
  //expect.assertions(1);
  return get("/react/stateless").then(data => {
    const $ = cheerio.load(data)
    expect($('body').text().trim()).toBe("react-stateless");
  });
});


test('React With Imports', () => {
  //expect.assertions(1);
  return get("/react/withimports").then(data => {
    const $ = cheerio.load(data)
    expect($('body').text().trim()).toBe("246");
  });
});


test('React With Helmet', () => {
  //expect.assertions(1);
  return get("/react/withhelmet").then(data => {
    const $ = cheerio.load(data)
    expect($('head title').text().trim()).toBe("Page Title");
  });
});

test('React With Custom Meta Charset', () => {
  //expect.assertions(1);
  return get("/react/withcustomcharset").then(data => {
    const $ = cheerio.load(data)
    expect( $('head [charset]').attr('charset') ).toBe("ISO-8859-1");
  });
});

test('React With Default Meta Charset', () => {
  //expect.assertions(1);
  return get("/react/withhelmet").then(data => {
    const $ = cheerio.load(data)
    expect( $('head [charset]').attr('charset') ).toBe("utf-8");
  });
});


test('React With getInitialProps', () => {
  //expect.assertions(1);
  return get("/react/withInitialProps").then(data => {
    const $ = cheerio.load(data)
    expect($('body').text().trim()).toBe("2,4,6");
  });
});

// TODO: test scss/css imports