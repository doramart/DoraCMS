<template>
    <PannelBox title="相关推荐" className="content-message">
        <div class="random-articls" v-if="articles && articles.length > 0">
            <el-row class="grid-content bg-purple-light" :gutter="15">
                <el-col :xs="12" :sm="12" :md="8" :lg="8" :xl="8" v-for="(item,index) in articles" :key="index">
                    <div class="contentImg">
                    <router-link :to="'/details/'+item._id+'.html'" class="continue-reading"><img :src="item.sImg" :alt="item.title" /></router-link>
                    </div>
                    <span class="title">
                        <router-link class="title" :to="'/details/'+item._id+'.html'">{{item.stitle?item.stitle:item.title}}</router-link>
                    </span>
                </el-col>
            </el-row>
        </div>
    </PannelBox>
</template>
<script>
let packageJson = require("../../../package.json");
import PannelBox from "./PannelBox.vue";
import { mapGetters, mapActions } from "vuex";
export default {
  props: {
    articles: Array
  },
  components: {
    PannelBox
  },
  computed: {}
};
</script>
<style lang="scss">

</style>
