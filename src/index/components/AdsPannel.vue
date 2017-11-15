<template>
    <div class="content-ads" v-if="ads.data">
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
                  <el-col class="case-item" :xs="12" :sm="8" :md="6" :lg="6" :xl="6" v-for="(item,index) in ads.data.items" :key="item._id">
                    <el-card :body-style="{ padding: '0px' }">
                        <div style="padding:14px 14px 5px;text-align:center;cursor:point">
                            <a :href="item.link" target="_blank"><img :src="item.sImg" class="image" :alt="item.alt"></a>
                            <span class="case-title">{{item.alt}}</span>                          
                        </div>
                    </el-card>
                  </el-col>
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
</template>
<script>
import { mapGetters } from "vuex";
import api from "~api";
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
      ads: {
        data: []
      }
    };
  },
  mounted() {
    api.get("ads/getOne", { id: this.id }).then(result => {
      let data = result.data;
      if (data.state == "success") {
        this.ads.data = data.doc;
      } else {
        console.log("获取广告内容失败");
      }
    });
  }
};
</script>

<style lang="scss">
.el-carousel__item h3 {
  color: #475669;
  font-size: 18px;
  opacity: 0.75;
  margin: 0;
}

.el-carousel__item:nth-child(2n) {
  background-color: #99a9bf;
}

.el-carousel__item:nth-child(2n + 1) {
  background-color: #d3dce6;
}

.img-pannel {
  img {
    width: 100%;
  }
}

.text-pannel ul li {
  display: inline-block;
  margin-right: 10px;
}

.case-title {
  color: #b4bccc;
  margin: 15px auto;
  font-size: 13px;
}
.case-item{
  margin-bottom: 20px;
}
</style>
