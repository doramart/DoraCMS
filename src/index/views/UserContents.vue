<template>
  <div class="contentContainer">
      <UserCenterTemp className="user-contents">
        <div v-if="contentlist && contentlist.docs.length>0">
          <UserContentsDataTable :dataList="contentlist.docs" :userInfo="loginState.userInfo"></UserContentsDataTable>
          <div class="content-pagination">
            <Pagination :pageInfo="contentlist.pageInfo" typeId="userReplies" />
          </div>
        </div>
        <div class="no-contents" v-else>
          <div class="um-profile-note">
            <i class="fa fa-frown-o"></i>
            <span>您还没有发布任何文章</span>
          </div>
        </div>
      </UserCenterTemp>
  </div>
</template>
<script>
import api from "~api";
import UserCenterTemp from "./UserCenterTemp";
import UserContentsDataTable from "../components/UserContentsDataTable";
import Pagination from "../components/Pagination.vue";

const validatorUtil = require("../../../utils/validatorUtil.js");
import { mapGetters, mapActions } from "vuex";
export default {
  name: "userContents",
  metaInfo() {
    return {
      title: "用户中心-文章列表"
    };
  },
  components: {
    UserCenterTemp,
    UserContentsDataTable,
    Pagination
  },
  data() {
    return {};
  },
  methods: {},
  mounted() {
    this.$store.dispatch("frontend/user/userContents");
  },
  computed: {
    ...mapGetters({
      contentlist: "frontend/user/contentlist",
      loginState: "frontend/user/getSessionState"
    })
  }
};
</script>

<style lang="scss">

</style>