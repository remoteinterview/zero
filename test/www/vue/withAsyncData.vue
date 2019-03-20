<template>
  <div>
    {{ url }}
  </div>
</template>

<script>
module.exports = {
  data: function () {
    return {
      value: 'Title'
    }
  },
  asyncData: function (props){
    return {a:"abc"}
  }
}
</script>
