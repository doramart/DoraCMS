<template>
    <PannelBox title="最新文章" :className="recentClassName">
        <div class="content-list">
            <ul>
                <li class="hot-li" v-for="item in recentItems" :key="item._id">
                    <el-row :gutter="10">
                    <el-col :xs="9" :sm="9" :md="9" :lg="9" :xl="9">
                        <div class="contentImg">
                            <router-link :to="'/details/'+item._id+'.html'" class="continue-reading">
                                <img :src="item.sImg" :alt="item.title" />
                            </router-link>
                        </div>
                    </el-col>
                    <el-col :xs="15" :sm="15" :md="15" :lg="15" :xl="15">
                        <div class="right-text">
                            <router-link class="title" :to="'/details/'+item._id+'.html'">{{item.title}}</router-link>
                            <span>{{item.updateDate}}</span>
                        </div>
                    </el-col>
                    </el-row>
                </li>
            </ul>
        </div>
    </PannelBox>
</template>
<script>
import PannelBox from "./PannelBox.vue";
export default {
  name: "recentlyContents",
  data() {
    return {
      loadingState: true,
      recentClassName: "recent-content-list"
    };
  },
  components: {
    PannelBox
  },
  props: ["recentItems"]
};
</script>

<style lang="scss">

</style>