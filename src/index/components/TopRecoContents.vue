<template>
    <div class="top-rec-contents">
          <el-row :gutter="0">
            <el-col :xs="12" :sm="24" :md="24" :lg="24" :xl="24" class="rec-li" v-for="(item) in currentlist" :key="item._id">
              <div class="contentImg">
                <router-link :to="'/details/'+item._id+'.html'" class="continue-reading">
                  <img :src="item.sImg" :alt="item.title" />
                </router-link>
              </div>
              <router-link class="title" :to="'/details/'+item._id+'.html'">{{item.title | cutWords(10)}}</router-link>
            </el-col>
          </el-row>
      </div>
</template>
<script>
export default {
  name: "recommendContents",
  data() {
    return {
      loadingState: true
    };
  },
  props: ["reclist"],
  components: {},
  serverCacheKey: props => {
    return `top-rec-list`;
  },
  computed: {
    currentlist() {
      if (this.reclist && this.reclist.length > 0) {
        return this.reclist.slice(0, 3);
      }
    }
  }
};
</script>

<style lang="scss">
.top-ads {
  margin-bottom: 10px;
  .el-loading-mask {
    height: 298px;
  }
  .top-rec-contents {
    .rec-li {
      position: relative;
      margin-bottom: 10px;

      .contentImg {
        height: 5.8rem;
      }
      img {
        width: 100%;
      }
      .title {
        font-size: 12px;
        position: absolute;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        width: 100%;
        color: #ffffff;
        text-indent: 10px;
      }
    }
  }
}
</style>