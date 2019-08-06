<template>
    <div>
        <el-table align="center" v-loading="loading" ref="multipleTable" :data="dataList" tooltip-effect="dark" style="width: 100%" :row-style="setRowState" @selection-change="handleSystemNotifySelectionChange">
            <el-table-column type="selection" width="55">
            </el-table-column>
            <el-table-column prop="notify.title" :label="$t('systemNotify.title')">
            </el-table-column>
            <el-table-column prop="notify.content" :label="$t('systemNotify.content')">
                <template slot-scope="scope">
                    <span v-html="scope.row.notify.content"></span>
                </template>
            </el-table-column>
            <el-table-column prop="date" :label="$t('systemNotify.date')">
            </el-table-column>
        </el-table>
    </div>
</template>

<script>
import services from "../../store/services.js";
export default {
  props: {
    dataList: Array
  },
  data() {
    return {
      loading: false,
      multipleSelection: []
    };
  },

  methods: {
    setRowState(row, index) {
      if (row && !row.row.isRead) {
        return {
          color: "#409EFF",
          fontWeight: "bold"
        };
      } else {
        return "";
      }
    },
    handleSystemNotifySelectionChange(val) {
      if (val && val.length > 0) {
        let ids = val.map((item, index) => {
          return item._id;
        });
        this.multipleSelection = ids;
        this.$emit("changeSystemNotifySelectList", ids);
      }
    }
  }
};
</script>
