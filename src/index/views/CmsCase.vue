<template>
    <article class="case-box">
        
        <div class="contentContainer">
            <el-row :gutter="0">
                <el-col :xs="1" :sm="1" :md="3" :lg="3">
                    &nbsp;
                </el-col>
                <el-col :xs="22" :sm="22" :md="18" :lg="18">
                    <el-row :gutter="20">
                      <h3>
                          这些站点在用DoraCMS：
                          <el-button-group>
                            <el-button size="mini" @click="getToStar" type="primary" plain icon="el-icon-star-on">Star</el-button>
                            <el-button size="mini" @click="getToStar" style="color:#2D2F33" plain>{{cmsStar}}</el-button>
                          </el-button-group>              
                      </h3>
                      <AdsPannel id="BkxSmqcaAZ" />
                    </el-row>
                </el-col>
                <el-col :xs="1" :sm="1" :md="3" :lg="3">
                    &nbsp;
                </el-col>
            </el-row>
        </div>
        
    </article>
</template>
<style lang="scss">
.case-box {
  min-height: 400px;
  h3 {
    margin: 5px 10px 20px;
    font-size: 15px;
    color: #878d99;
    .el-button--mini {
      padding: 5px 8px;
      font-weight: 700;
    }
  }
  img {
    width: 100%;
    height: 2rem;
  }
}
</style>

<script>
import AdsPannel from "../components/AdsPannel.vue";
import axios from "axios";
import metaMixin from "~mixins";
import { mapGetters } from "vuex";
export default {
  name: "case-item",
  mixins: [metaMixin],
  components: {
    AdsPannel
  },
  data() {
    return {
      cmsStar: 1,
      stargazersUrl: "https://github.com/doramart/DoraCMS/stargazers"
    };
  },
  computed: {
    ...mapGetters({
      systemConfig: "global/footerConfigs/getSystemConfig"
    }),
    currentCate() {
      let navs =
        this.$store.getters["global/category/getHeaderNavList"].data || [];
      const obj = navs.find(item => item._id === this.$route.params.typeId);
      return obj || {};
    }
  },
  methods: {
    getToStar() {
      window.open(this.stargazersUrl);
    }
  },
  mounted() {
    axios
      .get("https://api.github.com/repos/doramart/DoraCMS")
      .then(response => {
        this.cmsStar = response.data.stargazers_count;
      })
      .catch(function(error) {
        console.log(error);
      });
  },
  metaInfo() {
    const systemData = this.systemConfig.data[0];
    const { siteName, siteDiscription, siteKeywords } = systemData;
    return {
      title: "案例 | " + siteName,
      meta: [
        {
          vmid: "description",
          name: "description",
          content: this.currentCate.comments || siteDiscription
        },
        {
          vmid: "keywords",
          name: "keywords",
          content: this.currentCate.keywords || siteKeywords
        }
      ]
    };
  }
};
</script>