<template>
  <div class="up-icon">
    <!-- <i class="el-icon-download"></i> -->
    <svg-icon icon-class="icon_update"></svg-icon>
  </div>
</template>
<script>
export default {};
</script>
<style lang="scss" scoped>
.updateTemp-corner:hover .octo-arm {
  animation: octocat-wave 560ms ease-in-out;
}
.up-icon {
  border-radius: 50%;
  background: #67c23a;
  color: #ffffff;
  width: 25px;
  height: 25px;
  text-align: center;
  vertical-align: middle;
  .svg-icon {
    display: block;
    margin-top: 4px;
    margin-left: 4px;
  }
}
@keyframes octocat-wave {
  0%,
  100% {
    transform: rotate(0);
  }
  20%,
  60% {
    transform: rotate(-25deg);
  }
  40%,
  80% {
    transform: rotate(10deg);
  }
}

@media (max-width: 500px) {
  .updateTemp-corner:hover .octo-arm {
    animation: none;
  }
  .updateTemp-corner .octo-arm {
    animation: octocat-wave 560ms ease-in-out;
  }
}
</style>
