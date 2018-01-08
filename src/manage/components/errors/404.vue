<template>
    <div class="notice-404">
        <h3>404</h3>
        <div class="text">您访问的页面不存在或者您没有权限访问该模块 😏👽 &nbsp;<el-button type="text" @click="backToMain">返回管理首页</el-button></div>
    </div>
</template>
<script>
export default {
  methods: {
    backToMain() {
      this.$router.push("/main");
    }
  }
};
</script>
<style lang="scss">
.notice-404 {
  text-align: center;
  h3 {
    width: 25%;
    font-size: 12rem;
    color: #409eff;
    margin: 0 auto;
    margin-top: 10%;
  }
  .text {
    font-size: 15px;
    color: #878d99;
  }
}
</style>
