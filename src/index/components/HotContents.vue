<template>
    <div>
        <PannelBox title="推荐文章" className="hot-content-list">
            <div class="content-list">
                <ul>
                    <li class="hot-li" v-for="(item,index) in hotItems" :key="item._id">
                        <router-link :to="'/details/'+item._id+'.html'" class="continue-reading">
                            <img :src="item.sImg" :alt="item.title" />
                        </router-link>
                        <div class="left-area">
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
.hot-content-list {
  margin-bottom: 30px;
  .content-list {
    text-align: left;
    ul {
      .hot-li:last-child {
        border: none;
      }
      li {
        position: relative;
        padding: 10px 0;
        overflow: hidden;
        font-size: 14px;
        display: block;
        height: 2rem;
        img {
          width: 3rem;
          height: 2rem;
          position: absolute;
          border-radius: 4px;
          border: 1px solid #f0f0f0;
        }
        .left-area {
          padding-left: 4rem;
        }
      }
    }
  }
}
</style>