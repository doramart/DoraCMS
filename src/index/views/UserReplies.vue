<template>
  <div class="contentContainer">
      <UserCenterTemp className="user-message">
        <div v-if="replylist && replylist.docs.length>0">
          <UserReplieDataTable :dataList="replylist.docs" :userInfo="loginState.userInfo"></UserReplieDataTable>
          <div class="content-pagination">
            <Pagination :pageInfo="replylist.pageInfo" typeId="userReplies" />
          </div>
        </div>
        <div class="no-contents" v-else>
          <div class="um-profile-note">
            <i class="fa fa-frown-o"></i>
            <span>暂无参与话题</span>
          </div>
        </div>
      </UserCenterTemp>
    </div>
</template>
<script>
import api from "~api";
import UserCenterTemp from "./UserCenterTemp";
import UserReplieDataTable from "../components/UserReplieDataTable";
import Pagination from "../components/Pagination.vue";

const validatorUtil = require("../../../utils/validatorUtil.js");
import { mapGetters, mapActions } from "vuex";
export default {
  name: "userMessage",
  metaInfo() {
    return {
      title: "用户中心-参与话题"
    };
  },
  components: {
    UserCenterTemp,
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