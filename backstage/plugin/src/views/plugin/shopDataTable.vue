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
          <el-tag type="info">{{scope.row.version}}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="hooks" :label="$t('plugin.hooks')" width="180">
        <template slot-scope="scope">
          <div v-if="scope.row.hooks">{{scope.row.hooks.join(',')}}</div>
        </template>
      </el-table-column>

      <el-table-column prop="amount" :label="$t('plugin.amount')" width="100">
        <template slot-scope="scope">
          <el-button type="text" v-if="scope.row.amount == '0'" disabled>免费</el-button>
          <el-button type="text" v-if="scope.row.amount != '0'">{{scope.row.amount}}</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="installed" :label="$t('plugin.state')" width="200">
        <template slot-scope="scope">
          <div v-if="scope.row.installed">
            <el-tag size="medium" type="success">已安装</el-tag>
          </div>
          <div v-else>
            <el-tag size="medium" type="warning">未安装</el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="createTime" :label="$t('plugin.createTime')" width="200"></el-table-column>
      <el-table-column prop="initData" :label="$t('plugin.initData')" width="200"></el-table-column>

      <el-table-column :label="$t('main.dataTableOptions')" width="150" fixed="right">
        <template slot-scope="scope">
          <el-button
            v-if="Number(scope.row.amount)>0"
            size="mini"
            type="primary"
            plain
            round
            @click="buyPlugin(scope.$index, dataList)"
          >
            <svg-icon icon-class="icon_alipay" />
          </el-button>
          <el-button
            size="mini"
            type="info"
            plain
            round
            @click="editPlugin(scope.$index, dataList)"
          >
            <svg-icon icon-class="icon_doc" />
          </el-button>
          <el-button
            v-if="!scope.row.installed"
            size="mini"
            type="warning"
            plain
            round
            @click="installPlugin(scope.$index, dataList)"
          >
            <svg-icon icon-class="icon_install" />
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
  addPlugin,
  getOneShopPlugin,
  createInvoice,
  checkInvoice,
  pluginHeartBeat
} from "@/api/plugin";

export default {
  props: {
    dataList: Array,
    pageInfo: Object
  },
  data() {
    return {
      checkPaymentStateTask: "",
      green: { color: "#13CE66" },
      red: { color: "#FF4949" },
      loading: false,
      multipleSelection: [],
      heartBeatEvt: ""
    };
  },

  methods: {
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
      getOneShopPlugin({ id: rowData._id })
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
    installPlugin(index, rows) {
      this.$confirm(
        this.$t("main.install_notice"),
        this.$t("main.scr_modal_title"),
        {
          confirmButtonText: this.$t("main.confirmBtnText"),
          cancelButtonText: this.$t("main.cancelBtnText"),
          type: "warning"
        }
      )
        .then(() => {
          return addPlugin({
            pluginId: rows[index]._id
          });
        })
        .then(result => {
          if (result.status === 200) {
            // this.$store.dispatch("plugin/getShopPluginList", this.pageInfo);
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
    buyPlugin(index, rows) {
      this.$confirm("您确认要购买吗？", this.$t("main.scr_modal_title"), {
        confirmButtonText: this.$t("main.confirmBtnText"),
        cancelButtonText: this.$t("main.cancelBtnText"),
        type: "warning"
      })
        .then(() => {
          return createInvoice({
            pluginId: rows[index]._id
          });
        })
        .then(result => {
          if (result.status === 200) {
            let qrlink = result.data.qrCode;
            let noInvoice = result.data.noInvoice;
            let askQr = `/api/createQRCode?text=${encodeURIComponent(qrlink)}`;
            if (askQr) {
              this.$alert(
                `<img width='220' height='220' src='${askQr}' />`,
                "扫码支付",
                {
                  dangerouslyUseHTMLString: true,
                  showConfirmButton: false,
                  customClass: "qrClass",
                  callback: () => {
                    clearInterval(this.checkPaymentStateTask);
                  }
                }
              );
              this.checkPaymentStateTask = setInterval(() => {
                this.checkTradeState({ noInvoice });
              }, 5000);
            }
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
    checkTradeState(noInvoice) {
      checkInvoice({ noInvoice: noInvoice }).then(result => {
        if (result.status === 200 && result.data.checkState) {
          clearInterval(this.checkPaymentStateTask);
        }
      });
    }
  }
};
</script>
<style lang="scss">
.qrClass {
  width: auto !important;
}
</style>