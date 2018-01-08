<template>
  <div class="mainbody user-center">
      <el-row :gutter="0" class="header-main">
        <el-col :xs="1" :sm="1" :md="1" :lg="1" :xl="5">
          <div class="grid-content bg-purple">&nbsp;</div>
        </el-col>
        <el-col :xs="22" :sm="22" :md="22" :lg="22" :xl="14">
          <el-row :gutter="15">
              <el-col :xs="24" :sm="17" :md="17" :lg="17" >
                <div :class="className">
                  <UserBar />
                  <slot></slot>
                </div>
              </el-col>
              <el-col :xs="0" :sm="7" :md="7" :lg="7" >
                 <RecentContents :recentItems="recentArticle" />
              </el-col>
          </el-row>
        </el-col>
        <el-col :xs="1" :sm="1" :md="1" :lg="1" :xl="5">
          <div class="grid-content bg-purple">&nbsp;</div>
        </el-col>
      </el-row>
    </div>
</template>

<script>
import { mapGetters } from "vuex";
import UserBar from "../components/UserBar";
import RecentContents from "../components/RecentContents.vue";
export default {
  props: ["className"],
  components: {
    UserBar,
    RecentContents
  },
  computed: {
    ...mapGetters({
      recentArticle: "frontend/article/getRecentContentList"
    })
  },
  mounted() {
    this.$store.dispatch("frontend/article/getRecentContentList");
  }
};
</script>

