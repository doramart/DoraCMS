<template>
    <div>
        <PannelBox title="推荐文章" className="rec-content-list">
            <div class="content-list">
                <el-row :gutter="10">
                  <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12" class="hot-li" v-for="(item,index) in reclist" :key="item._id">
                    <div class="contentImg">
                      <router-link :to="'/details/'+item._id+'.html'" class="continue-reading">
                        <img :src="item.sImg" :alt="item.title" />
                      </router-link>
                    </div>
                    <router-link class="title" :to="'/details/'+item._id+'.html'">{{item.title | cutWords(25)}}</router-link>
                  </el-col>
                </el-row>
            </div>
        </PannelBox>
    </div>
</template>
<script>
import PannelBox from "./PannelBox.vue";
export default {
  name: "recommendContents",
  data() {
    return {
      loadingState: true
    };
  },
  props: ["reclist", "typeId"],
  components: {
    PannelBox
  },
  serverCacheKey: props => {
    return `recItem-${props.typeId}`;
  }
};
</script>

<style lang="scss">

</style>