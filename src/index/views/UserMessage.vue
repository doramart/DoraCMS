<template>
  <div class="contentContainer">
      <UserCenterTemp className="user-message">
        <div v-if="noticelist && noticelist.docs.length>0">
          <UserNoticeDataTable :dataList="noticelist.docs"></UserNoticeDataTable>
          <div class="content-pagination">
            <Pagination :pageInfo="noticelist.pageInfo" typeId="userNotice" />
          </div>
        </div>
        <div class="no-contents" v-else>
          <div class="um-profile-note">
            <i class="fa fa-frown-o"></i>
            <span>暂无消息</span>
          </div>
        </div>
      </UserCenterTemp>
    </div>
</template>
<script>
import api from "~api";
import UserCenterTemp from "./UserCenterTemp";
import UserNoticeDataTable from "../components/UserNoticeDataTable";
import Pagination from "../components/Pagination.vue";

const validatorUtil = require("../../../utils/validatorUtil.js");
import { mapGetters, mapActions } from "vuex";
export default {
  name: "userMessage",
  metaInfo() {
    return {
      title: "用户中心-消息"
    };
  },
  components: {
    UserCenterTemp,
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

</style>