<template>
    <div class="page-component-up" :style="{display:showScroll?'block':'none'}" @click="scrollToTop(300)"><i class="el-icon-caret-top"></i></div>
</template>
<script>
export default {
  name: "BackTop",
  data() {
    return {
      showScroll: false
    };
  },
  methods: {
    scrollToTop(scrollDuration) {
      const scrollHeight = window.scrollY,
        scrollStep = Math.PI / (scrollDuration / 15),
        cosParameter = scrollHeight / 2;
      let scrollCount = 0,
        scrollMargin,
        scrollInterval = setInterval(function() {
          if (window.scrollY != 0) {
            scrollCount = scrollCount + 1;
            scrollMargin =
              cosParameter - cosParameter * Math.cos(scrollCount * scrollStep);
            window.scrollTo(0, scrollHeight - scrollMargin);
          } else {
            clearInterval(scrollInterval);
          }
        }, 15);
    }
  },
  mounted() {
    window.onscroll = () => {
      let t = document.documentElement.scrollTop || document.body.scrollTop;
      if (t >= 400) {
        this.showScroll = true;
      } else {
        this.showScroll = false;
      }
    };
  }
};
</script>

<style lang="scss">

</style>