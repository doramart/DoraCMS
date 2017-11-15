<template>
     <div class="static-pannel">
        <div class="color-pannel" :style="{backgroundColor:'#' + renderColor(this.type)}"><i :class="'fa fa-fw ' + this.icon"></i></div>
        <div class="number-pannel">
            <h3 class="number" :style="{color:'#' + renderColor(this.type)}">{{this.num}}</h3>
            <span class="text">{{this.text}}</span>
        </div>
    </div>
</template>
<script>
export default {
  name: "staticPannel",
  props: ["num", "type", "text", "icon"],
  methods: {
    renderColor() {
      let pannelType = this.type;
      let colors = "409eff";
      switch (pannelType) {
        case "primary":
          colors = "409eff";
          break;
        case "success":
          colors = "67C23A";
          break;
        case "info":
          colors = "878D99";
          break;
        case "warning":
          colors = "EB9E05";
          break;
        case "danger":
          colors = "FA5555";
          break;
        default:
          colors = "409eff";
          break;
      }
      return colors;
    }
  }
};
</script>
<style lang="scss">
.static-pannel {
  border: 1px solid #e6ebf5;
  background-color: #fff;
  -webkit-box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  color: #2d2f33;
  height: 4.5rem;
  text-align: center;
  vertical-align: middle;
  border-radius: 4px;
  overflow: hidden;
  .color-pannel {
    width: 30%;
    height: 100%;
    float: left;
    color: #ffffff;
  }

  .number-pannel {
    width: 70%;
    float: right;
    .number {
      font-size: 27px;
      margin-top: 0.8rem;
      margin-bottom: 0;
      font-weight: 700;
    }
    .text {
      font-size: 12px;
      color: #c8c8c8;
      font-weight: 500;
    }
  }

  i {
    font-size: 1.8rem;
    margin-top: 1.3rem;
  }
}
</style>
