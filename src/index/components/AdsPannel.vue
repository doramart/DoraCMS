<template>
    <div>
        <div class="content-ads" v-if="ads.data && ads.data.items && ads.data.items.length>0">
            <div class="img-pannel" v-if="ads.data.type == '1'">
                <div v-if="ads.data.items.length == 1">
                    <a :href="ads.data.items[0].link" target="_blank"><img :src="ads.data.items[0].sImg" :alt="ads.data.items[0].alt" /></a>
                </div>
                <div v-else>
                    <!-- 轮播展示 -->
                    <div v-if="ads.data.carousel">
                        <el-carousel :height="ads.data.height+'px'">
                        <el-carousel-item v-for="item in ads.data.items" :key="item._id">
                            <h3>
                                <a :href="item.link" target="_blank"><img :height="ads.data.height+'px'" :src="item.sImg" :alt="item.alt" /></a>
                            </h3>
                        </el-carousel-item>
                    </el-carousel>
                    </div>
                    <!-- 橱窗展示 -->
                    <div v-else>
                    <el-row :gutter="20">
                        <el-col class="case-item" :xs="12" :sm="8" :md="6" :lg="6" :xl="6" v-for="(item,index) in ads.data.items" :key="item._id">
                        <el-card :body-style="{ padding: '0px' }">
                            <div style="padding:14px 14px 5px;text-align:center;cursor:point">
                                <a :href="item.link" target="_blank"><img :src="item.sImg" class="image" :alt="item.alt"></a>
                                <span class="case-title">{{item.alt}}</span>                          
                            </div>
                        </el-card>
                    </el-col>
                    </el-row>
                    </div>
                </div>
            </div>
            <div class="text-pannel" v-if="ads.data.type == '0'">
                <ul>
                    <li v-for="item in ads.data.items" :key="item._id">
                        <a :href="item.link" target="_blank">{{item.title}}</a>
                    </li>
                </ul>
            </div>
        </div>
        <div v-else>
            &nbsp;
        </div>
    </div>
    
    
</template>
<script>
import { mapGetters } from "vuex";
import api from "~api";
import _ from "lodash";
export default {
  name: "Ads",
  props: {
    id: String
  },
  serverCacheKey: props => {
    return `ads-item-${props.id}`;
  },
  data() {
    return {
      interval: 5000,
      ads: {
        data: []
      }
    };
  },
  mounted() {
    let adsList = this.$store.getters["global/ads/getAdsList"];
    if (!_.isEmpty(adsList)) {
      let currentAds = _.filter(adsList.data, doc => {
        return doc._id === this.id;
      });
      currentAds.length > 0 && (this.ads.data = currentAds[0]);
    }
  }
};
</script>

<style lang="scss">

</style>
