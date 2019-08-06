<template>
    <div>
        <el-table align="center" ref="multipleTable" :data="dataList" tooltip-effect="dark" style="width: 100%" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55">
            </el-table-column>
            <el-table-column prop="name" :label="$t('ads.name')" width="120">
            </el-table-column>
            <el-table-column prop="type" :label="$t('ads.type')" width="80">
                <template slot-scope="scope">
                    <span v-if="scope.row.type == '0'">{{$t('ads.typeText')}}</span>
                    <span v-if="scope.row.type == '1'">{{$t('ads.typePic')}}</span>
                </template>
            </el-table-column>
            <el-table-column prop="state" :label="$t('ads.enable')" width="100" show-overflow-tooltip>
                <template slot-scope="scope">
                    <i :class="scope.row.state ? 'fa fa-check-circle' : 'fa fa-minus-circle'" :style="scope.row.state ? green : red"></i>
                </template>
            </el-table-column>
            <el-table-column prop="comments" :label="$t('ads.dis')" show-overflow-tooltip>
            </el-table-column>
            <el-table-column :label="$t('main.dataTableOptions')">
                <template slot-scope="scope">
                   <el-tooltip class="item" effect="dark" content="Get code" placement="top-start">
                    <el-button size="mini" type="warning" plain round v-clipboard:copy='inputData(scope.$index, dataList)' v-clipboard:success='clipboardSuccess'><i class="fa fa-copy"></i></el-button>
                   </el-tooltip>
                    <el-button size="mini" type="primary" plain round @click="editAdsInfo(scope.$index, dataList)"><i class="fa fa-edit"></i></el-button>
                    <el-button size="mini" type="danger" plain round icon="el-icon-delete" @click="deleteAds(scope.$index, dataList)"></el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<script>
import services from "../../store/services.js";
import clipboard from "@/directive/clipboard/index.js";

export default {
  props: {
    dataList: Array
  },
  data() {
    return {
      green: { color: "#13CE66" },
      red: { color: "#FF4949" }
      // inputData: "hello"
    };
  },
  directives: {
    clipboard
  },
  methods: {
    inputData(index, rows) {
      let targetRow = rows[index];
      let adsStr = `
      {% remote key="${targetRow.name}",api="ads/getOne",query='{"name":"${
        targetRow.name
      }"}' %}
      {{adsPannel.slider(${targetRow.name})}}
      `;
      return adsStr;
    },
    clipboardSuccess() {
      this.$message({
        message: "复制成功",
        type: "success",
        duration: 1500
      });
    },
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },
    editAdsInfo(index, rows) {
      let rowData = rows[index];
      this.$store.dispatch("adsInfoForm", {
        edit: true,
        formData: rowData
      });
      this.$router.push("/editAds/" + rowData._id);
    },
    deleteAds(index, rows) {
      this.$confirm(
        this.$t("main.del_notice"),
        this.$t("main.scr_modal_title"),
        {
          confirmButtonText: this.$t("main.confirmBtnText"),
          cancelButtonText: this.$t("main.cancelBtnText"),
          type: "warning"
        }
      )
        .then(() => {
          return services.delAds({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.data.status === 200) {
            this.$store.dispatch("getAdsList");
            this.$message({
              message: this.$t("main.scr_modal_del_succes_info"),
              type: "success"
            });
          } else {
            this.$message.error(result.data.message);
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