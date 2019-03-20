<template>
  <div>
    <!-- title: {{ value }}
    renderer: {{ renderer }} -->
    {{ url.query.id }}
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
    return {
      url: props.url,
      renderer: typeof window === 'undefined' ? "server": "client"
    }
  }
}
</script>
