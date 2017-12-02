<template>

    <div class="random-articls" v-if="articles && articles.length > 0">
        <el-row class="grid-content bg-purple-light" :gutter="15">
            <el-col :xs="12" :sm="12" :md="6" :lg="6" v-for="(item,index) in articles" :key="index">
                <router-link :to="'/details/'+item._id+'.html'" class="continue-reading"><img :src="item.sImg" :alt="item.title" /></router-link>
                <span class="title">{{item.stitle}}</span>
            </el-col>
        </el-row>
    </div>

</template>
<script>
let packageJson = require("../../../package.json");

import { mapGetters, mapActions } from "vuex";
export default {
  props: {
    articles: Array
  },
  computed: {}
};
</script>
<style lang="scss">
.random-articls {
  margin-top: 40px;
  margin-bottom: 25px;
  img {
    border-radius: 4px;
    border: 1px solid #f0f0f0;
  }
  .title {
    display: block;
    text-align: center;
    padding: 10px;
  }
}
</style>
