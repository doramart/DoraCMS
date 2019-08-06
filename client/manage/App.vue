<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: "App",
  beforeMount() {
    this.$store.dispatch("loginState", {
      state: true
    });
  }
};
</script>
