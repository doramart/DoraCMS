<template>
  <div>
    <el-table
      align="center"
      v-loading="loading"
      ref="multipleTable"
      :data="dataList"
      tooltip-effect="dark"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55"></el-table-column>

      <el-table-column prop="name" :label="$t('plugin.name')"></el-table-column>

      <el-table-column prop="description" :label="$t('plugin.description')" width="200"></el-table-column>

      <el-table-column prop="version" :label="$t('plugin.version')">
        <template slot-scope="scope">
          <div v-if="scope.row.shouldUpdate">
            <el-badge is-dot class="item">
              <el-tag type="info">{{scope.row.version}}</el-tag>
            </el-badge>
          </div>
          <div v-else>
            <el-tag type="info">{{scope.row.version}}</el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="hooks" :label="$t('plugin.hooks')" width="180">
        <template slot-scope="scope">
          <div v-if="scope.row.hooks">{{scope.row.hooks.join(',')}}</div>
        </template>
      </el-table-column>

      <el-table-column prop="enable" :label="$t('plugin.enable')" width="180">
        <template slot-scope="scope">
          <el-switch @change="changePluginEnable(scope.$index, dataList)" v-model="scope.row.state"></el-switch>
        </template>
      </el-table-column>

      <el-table-column prop="createTime" :label="$t('plugin.createTime')"></el-table-column>

      <el-table-column :label="$t('main.dataTableOptions')" width="150" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="primary"
            plain
            round
            @click="editPlugin(scope.$index, dataList)"
          >
            <svg-icon icon-class="icon_doc" />
          </el-button>
          <el-button
            size="mini"
            type="danger"
            plain
            round
            @click="deletePlugin(scope.$index, dataList)"
          >
            <svg-icon icon-class="icon_uninstall" />
          </el-button>
          <el-button
            size="mini"
            type="warning"
            v-if="scope.row.shouldUpdate"
            plain
            round
            @click="updatePlugin(scope.$index, dataList)"
          >
            <svg-icon icon-class="icon_update" />
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import {
  deletePlugin,
  getOnePlugin,
  getOneShopPlugin,
  updatePlugin,
  pluginHeartBeat,
  enablePlugin
} from "@/api/plugin";

export default {
  props: {
    dataList: Array,
    pageInfo: Object
  },
  data() {
    return {
      green: { color: "#13CE66" },
      red: { color: "#FF4949" },
      loading: false,
      multipleSelection: [],
      heartBeatEvt: ""
    };
  },

  methods: {
    changePluginEnable(index, rows) {
      let rowData = rows[index];
      enablePlugin({ id: rowData.id, state: rowData.state })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("plugin/getPluginList");
          } else {
            this.$message.error(result.message);
          }
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: this.$t("main.scr_modal_del_error_info")
          });
        });
    },
    heartBeat() {
      let _this = this;
      pluginHeartBeat()
        .then(result => {
          if (result.status === 200) {
            clearTimeout(_this.heartBeat);
            window.location.reload();
          } else {
            if (!_this.heartBeatEvt) {
              _this.heartBeatEvt = setInterval(_this.heartBeat, 2000);
            }
          }
        })
        .catch(() => {
          if (!_this.heartBeatEvt) {
            _this.heartBeatEvt = setInterval(_this.heartBeat, 2000);
          }
        });
    },
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },
    editPlugin(index, rows) {
      let rowData = rows[index];
      getOneShopPlugin({ id: rowData.pluginId })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("plugin/showPluginForm", {
              edit: true,
              formData: result.data
            });
          } else {
            this.$message.error(result.message);
          }
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: this.$t("main.scr_modal_del_error_info")
          });
        });
    },
    deletePlugin(index, rows) {
      this.$confirm(
        this.$t("main.uninstall_notice"),
        this.$t("main.scr_modal_title"),
        {
          confirmButtonText: this.$t("main.confirmBtnText"),
          cancelButtonText: this.$t("main.cancelBtnText"),
          type: "warning"
        }
      )
        .then(() => {
          return deletePlugin({
            pluginId: rows[index]._id
          });
        })
        .then(result => {
          if (result.status === 200) {
            // this.$store.dispatch("plugin/getPluginList", this.pageInfo);
            setTimeout(() => {
              this.heartBeat();
            }, 3000);
          } else {
            this.$message.error(result.message);
          }
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: this.$t("main.scr_modal_del_error_info")
          });
        });
    },
    updatePlugin(index, rows) {
      this.$confirm(
        this.$t("main.update_notice"),
        this.$t("main.scr_modal_title"),
        {
          confirmButtonText: this.$t("main.confirmBtnText"),
          cancelButtonText: this.$t("main.cancelBtnText"),
          type: "warning"
        }
      )
        .then(() => {
          return updatePlugin({
            pluginId: rows[index]._id
          });
        })
        .then(result => {
          if (result.status === 200) {
            setTimeout(() => {
              this.heartBeat();
            }, 3000);
          } else {
            this.$message.error(result.message);
          }
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: this.$t("main.scr_modal_del_error_info")
          });
        });
    }
  }
};
</script>
<style lang="scss" scoped>
.item {
  margin-top: 10px;
  margin-right: 50px;
}
</style>