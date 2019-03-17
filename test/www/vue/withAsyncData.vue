<template>
  <div>
    {{ params[0] }}
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
