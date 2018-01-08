<template>
    <header class="header">
        <el-row :gutter="0" class="header-main">
            <el-col :xs="1" :sm="1" :md="1" :lg="1" :xl="5">
                <div class="grid-content bg-purple">&nbsp;</div>
            </el-col>
            <el-col :xs="22" :sm="22" :md="22" :lg="22" :xl="14">
                <el-row :gutter="15" class="grid-content bg-purple-light">
                    <el-col :xs="24" :sm="4" :md="4" :lg="4">
                      <el-row>
                        <el-col :xs="7" :sm="0" :md="0" :lg="0" :xl="0">
                          <el-dropdown trigger="click">
                          <el-button class="toggle-menu" size="mini" plain><i class="fa fa-align-justify"></i></el-button>
                          <el-dropdown-menu class="drop-menu" slot="dropdown">
                            <el-dropdown-item v-for="(nav,index) in headerNav" :key="index" v-once>
                                <router-link :to="{path: '/'+nav.defaultUrl+ '___'+nav._id}">{{nav.name}}</router-link>
                            </el-dropdown-item>
                            <el-dropdown-item divided v-if="loginState.logined && loginState.userInfo">
                              <div>{{loginState.userInfo.userName}}
                                &nbsp;<el-button type="text" @click="logOut">退出</el-button>
                              </div>
                            </el-dropdown-item>
                            <el-dropdown-item divided v-else>
                              <div>
                                <el-button type="text" @click="login">登录</el-button>
                                <el-button type="text" @click="regUser">注册</el-button>
                              </div>
                            </el-dropdown-item>
                          </el-dropdown-menu>
                          </el-dropdown>
                        </el-col>
                        <el-col :xs="10" :sm="24" :md="24" :lg="24" :xl="24">
                          <div class="header-logo">
                              <router-link :to="{path: '/'}">
                                  <img src="../../assets/logo.png" />
                              </router-link>
                          </div>
                        </el-col>
                        <el-col :xs="7" :sm="0" :md="0" :lg="0" :xl="0">
                          <el-popover
                            ref="popoverSearch"
                            placement="bottom"
                            width="100%"
                            v-model="visibleSearchPannel">
                            <div>
                              <el-input size="small" placeholder="请输入关键字" v-model="searchkey" suffix-icon="el-icon-search" @keyup.enter.native="searchResult">
                              </el-input>
                            </div>
                          </el-popover>
                          <el-button v-popover:popoverSearch class="toggle-search" size="mini" plain><i class="fa fa-search"></i></el-button>
                        </el-col>
                      </el-row>                   
                    </el-col>
                    <el-col :xs="0" :sm="11" :md="11" :lg="11">
                        <nav class="header-nav">
                          <ul>
                            <li :class="{active : $route.fullPath == '/'}"><router-link :to="{path: '/'}">首页</router-link></li>
                            <li>
                              <el-dropdown size="medium">
                              <span class="el-dropdown-link">
                                文章分类<i class="el-icon-arrow-down el-icon--right"></i>
                              </span>
                              <el-dropdown-menu slot="dropdown">
                                <el-dropdown-item v-for="(nav,index) in headerNav" :key="index" v-once>
                                  <router-link :to="{path: '/'+nav.defaultUrl+ '___'+nav._id}">{{nav.name}}</router-link>
                                </el-dropdown-item>
                              </el-dropdown-menu>
                            </el-dropdown>
                            </li>
                            <li :class="{active : $route.fullPath == '/cmscase___SkCL09aCb'}"><router-link :to="{path: '/cmscase___SkCL09aCb'}">应用案例</router-link></li>
                          </ul>
                        </nav>
                    </el-col>
                    <el-col :xs="0" :sm="9" :md="9" :lg="9" class="right-pannel">
                        <el-row>
                            <el-col :xs="0" :sm="14" :md="14" :lg="12" hidden-xs-only>
                                <SearchBox />
                            </el-col>
                            <el-col :xs="24" :sm="10" :md="10" :lg="12">
                                <LoginPannel ref="loginPannel"/>
                            </el-col>
                        </el-row>
                    </el-col>
                </el-row>
            </el-col>
            <el-col :xs="1" :sm="1" :md="1" :lg="1" :xl="5">
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
    await store.dispatch("global/ads/getAdsList");
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
    return {
      visibleSearchPannel: false,
      searchkey: ""
    };
  },
  computed: {
    ...mapGetters({
      loginState: "frontend/user/getSessionState"
    }),
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
  },
  methods: {
    searchResult() {
      this.visibleSearchPannel = false;
      this.$router.replace("/search/" + this.searchkey);
      this.searchkey = "";
    },
    login() {
      this.$router.push("/users/login");
    },
    regUser() {
      this.$router.push("/users/reg");
    },
    logOut() {
      this.$refs.loginPannel.logout();
    }
  }
};
</script>
<style lang="scss">

</style>
