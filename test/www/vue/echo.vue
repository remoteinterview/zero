<template>
  <div>
    <input type="text" id="container" placeholder="enter text" v-model="value">
    <p>{{ value }}</p>
  </div>
</template>

<script>
module.exports = {
  data: function () {
    return {
      value: 'Title'
    }
  },
  head: function (){
    return {
      title: "My Title" + window.location.host,
      meta: [
        // hid is used as unique identifier. Do not use `vmid` for it as it will not work
        { hid: 'description', name: 'description', content: 'My custom description' }
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