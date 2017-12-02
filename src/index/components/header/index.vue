<template>
    <header class="header">
        <el-row :gutter="0" class="header-main">
            <el-col :xs="1" :sm="1" :md="3" :lg="3" :xl="6">
                <div class="grid-content bg-purple">&nbsp;</div>
            </el-col>
            <el-col :xs="22" :sm="22" :md="18" :lg="18" :xl="12">
                <el-row :gutter="10" class="grid-content bg-purple-light">
                    <el-col :xs="24" :sm="4" :md="4" :lg="4">
                        <div class="header-logo">
                            <router-link :to="{path: '/'}">
                                <img src="../../assets/logo.png" />
                            </router-link>
                        </div>
                    </el-col>
                    <el-col :xs="24" :sm="13" :md="13" :lg="13">
                        <nav class="header-nav">
                            <el-row type="flex">
                                <el-col v-for="(nav,index) in headerNav" :key="index" v-once>
                                    <router-link :to="{path: '/'+nav.defaultUrl+ '___'+nav._id}">{{nav.name}}</router-link>
                                </el-col>
                            </el-row>
                        </nav>
                    </el-col>
                    <el-col :xs="0" :sm="7" :md="7" :lg="7">
                        <el-row>
                            <el-col :xs="0" :sm="14" :md="14" :lg="14" hidden-xs-only>
                                <SearchBox />
                            </el-col>
                            <el-col :xs="24" :sm="24" :md="24" :lg="10">
                                <LoginPannel/>
                            </el-col>
                        </el-row>
                    </el-col>
                </el-row>
            </el-col>
            <el-col :xs="1" :sm="1" :md="3" :lg="3" :xl="6">
                <div class="grid-content bg-purple">
                    &nbsp;
                </div>
            </el-col>
        </el-row>
    </header>
</template>
<script>
import LoginPannel from "./loginPannel";
import SearchBox from "./searchBox";
import _ from "lodash";
import { mapGetters } from "vuex";
export default {
  name: "Header",
  async asyncData({ store, route }, config = { model: "full" }) {
    const { params: { id, key, by, current, typeId }, path } = route;
    const base = { ...config, id, path, key, by, current, typeId };
    await store.dispatch("global/category/getHeaderNavList", base);
  },
  serverCacheKey: props => {
    return `navlist-${props.navs}`;
  },
  components: {
    LoginPannel,
    SearchBox
  },
  props: {
    navs: Array
  },
  data() {
    return {};
  },
  computed: {
    headerNav() {
      let fullNav = this.$store.getters["global/category/getHeaderNavList"];
      let navs = fullNav.data;
      if (navs && navs.length > 0) {
        return _.filter(navs, doc => {
          return doc.parentId === "0";
        });
      } else {
        return [];
      }
    }
  }
};
</script>
<style lang="scss">
.header {
  overflow: hidden;
  border-bottom: 1px solid #f1f1f1;

  .header-main {
    margin: 0 auto;
    padding: 5px 0px;
    overflow: hidden;
    .header-logo {
      img {
        max-height: 40px;
      }
    }

    .header-nav {
      height: 40px;
      line-height: 40px;
      float: left;
      width: 100%;
      .el-row {
        margin: 0;
        padding: 0;
        .el-col {
          list-style-type: none;
          display: inline-block;
          text-align: center;
          a.router-link-active {
            color: #409eff;
          }
        }
      }
    }
  }
}
</style>
