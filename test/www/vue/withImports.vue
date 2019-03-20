<template>
  <div>
    {{ evens }}
  </div>
</template>

<script>
var _ = require('underscore');

module.exports = {
  data: function () {
    return {
      evens: _.reject([1, 2, 3, 4, 5, 6], (num) => num % 2 != 0).join(", ")
    }
  },
  head: function (){
    return {
      title: "My Title",
      meta: [
        // hid is used as unique identifier. Do not use `vmid` for it as it will not work
        { hid: 'description', name: 'description', content: 'description' }
      ]
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