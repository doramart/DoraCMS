<template>
  <div id="navbar-app">
    <Layout>
      <router-view />
    </Layout>
  </div>
</template>
<script>
import Layout from "@/layout";
export default {
  name: "Navbar",
  components: {
    Layout,
  },
};
</script>
<style>
#navbar-app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
