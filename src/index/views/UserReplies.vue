<template>
  <div class="contentContainer">
    <div class="mainbody user-center">
      <el-row :gutter="0" class="header-main">
        <el-col :xs="1" :sm="1" :md="1" :lg="2" :xl="5">
          <div class="grid-content bg-purple">&nbsp;</div>
        </el-col>
        <el-col :xs="22" :sm="22" :md="22" :lg="20" :xl="14">
          <div class="user-message">
            <UserBar />
            <div v-if="replylist">
              <UserReplieDataTable :dataList="replylist.docs" :userInfo="loginState.userInfo"></UserReplieDataTable>
              <div class="content-pagination">
                <Pagination :pageInfo="replylist.pageInfo" typeId="userReplies" />
              </div>
            </div>
            <div v-else>
              暂无参与话题...
            </div>
          </div>
        </el-col>
        <el-col :xs="1" :sm="1" :md="1" :lg="2" :xl="5">
          <div class="grid-content bg-purple">
            &nbsp;
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import api from "~api";
import UserBar from "../components/UserBar";
import UserReplieDataTable from "../components/UserReplieDataTable";
import Pagination from "../components/Pagination.vue";

const validatorUtil = require("../../../utils/validatorUtil.js");
import { mapGetters, mapActions } from "vuex";
export default {
  name: "userMessage",
  metaInfo() {
    return {
      title: "用户中心"
    };
  },
  components: {
    UserBar,
    UserReplieDataTable,
    Pagination
  },
  data() {
    return {};
  },
  methods: {},
  mounted() {
    this.$store.dispatch("frontend/user/userReplies");
  },
  computed: {
    ...mapGetters({
      replylist: "frontend/user/replylist",
      loginState: "frontend/user/getSessionState"
    })
  }
};
</script>

<style lang="scss">
</style>