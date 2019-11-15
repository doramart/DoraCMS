<template>
  <div class="block dr-pagination">
    <div v-if="pageInfo">
      <div v-if="device == 'mobile'">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page.sync="pageInfo.current"
          :page-size="pageInfo.pageSize"
          small
          layout="prev, pager, next"
          :total="pageInfo.totalItems"
        ></el-pagination>
      </div>
      <div v-else>
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
  </div>
</template>
<style lang="scss">
.dr-pagination {
  text-align: center;
  margin: 15px auto;
}
</style>
<script>
export default {
  props: {
    device: String,
    pageInfo: Object,
    pageType: String
  },
  methods: {
    renderPageList(current = 1, pageSize = 10) {
      let searchkey = this.pageInfo ? this.pageInfo.searchkey : "";
      let state = this.pageInfo ? this.pageInfo.state : "";
      let user = this.pageInfo ? this.pageInfo.user : "";
      let targetCurrent = current;
      this.$store.dispatch("systemOptionLog/getSystemLogsList", {
        current: targetCurrent,
        pageSize,
        searchkey
      });
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
