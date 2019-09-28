var codes = [];
codes["js"] = `
module.exports = (req, res)=> res.send('Hello')
`;
codes["react"] = `
module.exports = ()=> <h1>Hello React</h1>
`;
codes["html"] = `
<h1>Hello HTML</h1>
`;
codes["mdx"] = `
# Hello MDX
`;
codes["python"] = `
def handler():
  return "Hello Python"
`;
codes["vue"] = `
<template>
  <p>{{ greeting }} World!</p>
</template>

<script>
module.exports = {
  data: function () {
    return {
      greeting: 'Hello Vue'
    }
  }
}
</script>

<style scoped>
p {
  font-size: 2em;
  text-align: center;
}
</style>
`;

codes["proxy"] = `
{
  "type": "proxy",
  "url": "http://127.0.0.1:3123/path1"
}
`;
module.exports = codes;
