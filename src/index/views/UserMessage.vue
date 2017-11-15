<template>
  <div class="user-center">
    <div>
      <UserBar />
      <el-row :gutter="0" class="header-main">
        <el-col :xs="1" :sm="1" :md="3" :lg="3">
          <div class="grid-content bg-purple">&nbsp;</div>
        </el-col>
        <el-col :xs="22" :sm="22" :md="18" :lg="18">
          <div class="user-message">
            <div v-if="noticelist.docs.length>0">
              <UserNoticeDataTable :dataList="noticelist.docs"></UserNoticeDataTable>
              <div class="content-pagination">
                <Pagination :pageInfo="noticelist.pageInfo" typeId="userNotice" />
              </div>
            </div>
            <div v-else>
              暂无消息...
            </div>
          </div>
        </el-col>
        <el-col :xs="1" :sm="1" :md="3" :lg="3">
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
import UserNoticeDataTable from "../components/UserNoticeDataTable";
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
    UserNoticeDataTable,
    Pagination
  },
  data() {
    return {};
  },
  methods: {},
  mounted() {
    this.$store.dispatch("frontend/user/userNotices");
  },
  computed: {
    ...mapGetters({
      noticelist: "frontend/user/noticelist"
    })
  }
};
</script>

<style lang="scss">
.user-center {
  background-color: #f4f5f5;
  .user-message {
    margin: 15px 0;
    padding: 15px;
    background-color: #ffffff;
  }
}
</style>