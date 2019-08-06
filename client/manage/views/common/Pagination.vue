<template>
  <div class="block dr-pagination">
    <div v-if="pageInfo">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page.sync="pageInfo.current"
        :page-sizes="[10, 30, 50]"
        :page-size="pageInfo.pageSize"
        layout="sizes, prev, pager, next"
        :total="pageInfo.totalItems"
      ></el-pagination>
    </div>
  </div>
</template>
<style lang="">
.dr-pagination {
  text-align: center;
  margin: 15px auto;
}
</style>
<script>
export default {
  props: {
    pageInfo: Object,
    pageType: String
  },
  methods: {
    renderPageList(current = 1, pageSize = 10) {
      let searchkey = this.pageInfo ? this.pageInfo.searchkey : "";
      let state = this.pageInfo ? this.pageInfo.state : "";
      let user = this.pageInfo ? this.pageInfo.user : "";
      let targetCurrent = current;
      if (this.pageType === "content") {
        this.$store.dispatch("getContentList", {
          current: targetCurrent,
          pageSize,
          searchkey,
          state,
          userId: user
        });
      } else if (this.pageType === "adminUser") {
        this.$store.dispatch("getAdminUserList", {
          current: targetCurrent,
          pageSize,
          searchkey
        });
      } else if (this.pageType === "adminGroup") {
        this.$store.dispatch("getAdminGroupList", {
          current: targetCurrent,
          pageSize,
          searchkey
        });
      } else if (this.pageType === "contentMessage") {
        this.$store.dispatch("getContentMessageList", {
          current: targetCurrent,
          pageSize,
          searchkey
        });
      } else if (this.pageType === "contentTag") {
        this.$store.dispatch("getContentTagList", {
          current: targetCurrent,
          pageSize,
          searchkey
        });
      } else if (this.pageType === "regUser") {
        this.$store.dispatch("getRegUserList", {
          current: targetCurrent,
          pageSize,
          searchkey
        });
      } else if (this.pageType === "backUpData") {
        this.$store.dispatch("getBakDateList", {
          current: targetCurrent,
          pageSize,
          searchkey
        });
      } else if (this.pageType === "systemOptionLogs") {
        let type = this.pageInfo ? this.pageInfo.type : "";
        this.$store.dispatch("getSystemLogsList", {
          current: targetCurrent,
          pageSize,
          searchkey,
          type
        });
      } else if (this.pageType === "systemNotify") {
        this.$store.dispatch("getSystemNotifyList", {
          current: targetCurrent,
          pageSize,
          searchkey
        });
      } else if (this.pageType === "systemAnnounce") {
        this.$store.dispatch("getSystemAnnounceList", {
          current: targetCurrent,
          pageSize,
          searchkey
        });
      } else if (this.pageType === "ads") {
        this.$store.dispatch("getAdsList", {
          current: targetCurrent,
          pageSize,
          searchkey
        });
      } else if (this.pageType === "siteMessage") {
        this.$store.dispatch("getSiteMessageList", {
          current: targetCurrent,
          pageSize,
          searchkey
        });
      } else if (this.pageType === "helpCenter") {
        this.$store.dispatch("getHelpCenterList", {
          current: targetCurrent,
          pageSize,
          searchkey
        });
      } else if (this.pageType === "versionManage") {
        this.$store.dispatch("getVersionManageList", {
          current: targetCurrent,
          pageSize,
          searchkey
        });
      }
      //ComponentPaginationEnd
    },
    handleSizeChange(val) {
      console.log(`每页 ${val} 条`);
      let current = this.pageInfo ? this.pageInfo.current : 1;
      this.renderPageList(current, val);
    },
    handleCurrentChange(val) {
      console.log(`当前页: ${val}`);
      let pageSize = this.pageInfo ? this.pageInfo.pageSize : 10;
      this.renderPageList(val, pageSize);
    }
  },
  data() {
    return {};
  }
};
</script>
