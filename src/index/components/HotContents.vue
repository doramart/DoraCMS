<template>
    <div>
        <PannelBox title="热门文章" className="hot-content-list">
            <div class="content-list">
            <ul>
                <li :key='index' v-for="(item,index) in hotItems">
                    <span class="triangle"></span>
                    <div class="con">
                        <router-link class="title" :to="'/details/'+item._id+'.html'">{{item.title}}</router-link>
                    </div>
                </li>
            </ul>
        </div>
        </PannelBox>
    </div>
</template>
<script>
import PannelBox from "./PannelBox.vue";
export default {
  name: "hotContents",
  data() {
    return {
      loadingState: true
    };
  },
  props: ["hotItems", "typeId"],
  components: {
    PannelBox
  },
  serverCacheKey: props => {
    return `hotItem-${props.typeId}`;
  }
};
</script>

<style lang="scss">

</style>