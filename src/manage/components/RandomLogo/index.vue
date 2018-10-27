<template>
    <div class="random-logo">
        <div v-if="(user.logo).indexOf('defaultlogo.png')>0">
            <span class="randomLogo" :style="{backgroundColor:renderLogo()}">{{(user.userName).substring(0,1).toLocaleUpperCase()}}</span>
            </div>
            <div v-else>
            <img :src="user.logo" :alt="user.userName" :title="user.userName" />
        </div>
    </div>
</template>
<script>
export default {
  props: ["user"],
  data() {
    return {
      colorList: [
        "#409EFF",
        "#67C23A",
        "#E6A23C",
        "#F56C6C",
        "#909399",
        "#409EFF",
        "#67C23A",
        "#E6A23C",
        "#F56C6C",
        "#909399"
      ]
    };
  },
  methods: {
    renderLogo() {
      let count = Math.round(Math.random() * 6 + 1);
      return this.colorList[count];
    }
  }
};
</script>

<style lang="scss">
.random-logo {
  .randomLogo {
    color: #ffffff;
    border-radius: 50%;
    max-width: 75%;
    height: 40px;
    width: 40px;
    display: block;
    position: absolute;
    line-height: 40px;
    text-align: center;
    font-size: 20px;
    box-shadow: 0px 1px 1px #aaa;
  }
  img {
    border-radius: 50%;
    max-width: 75%;
    height: 40px;
    width: 40px;
    position: absolute;
    box-shadow: 0px 1px 1px #aaa;
  }
}
</style>
