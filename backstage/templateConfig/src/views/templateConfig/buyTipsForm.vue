<template>
  <el-dialog
    title="支付宝扫码支付"
    custom-class="buyTipsDialog"
    :visible.sync="buyTipsDialogState.show"
    width="30%"
    :close-on-click-modal="false"
    :before-close="closeTips"
  >
    <div slot="title" class="header-title">
      <svg-icon style="red" icon-class="icon_safe" />支付宝扫码支付
    </div>
    <el-row :gutter="10">
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <div class="tips-content">{{buyTipsDialogState.info.buy_tips}}</div>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <div class="grid-content bg-purple-light" v-if="buyTipsDialogState.buyQr">
          <img width="180" height="180" :src="buyTipsDialogState.buyQr" alt />
        </div>
        <div style="width:100px;height:100px;textAlign:center;margin:0 auto;" v-else>
          <i class="el-icon-loading"></i>
        </div>
      </el-col>
    </el-row>
  </el-dialog>
</template>

<script>
export default {
  props: ["buyTipsDialogState", "taskId"],
  data() {
    return {};
  },
  methods: {
    closeTips(done) {
      this.buyTipsDialogState.show = false;
      this.buyTipsDialogState.info = {};
      clearInterval(this.taskId);
      done();
    }
  }
};
</script>
<style lang="scss">
.buyTipsDialog {
  .header-title {
    svg {
      color: #67c23a;
      margin-right: 10px;
    }
  }
  .tips-content {
    padding-top: 20px;
  }
  .el-dialog__body {
    padding: 0 20px 20px !important;
  }
}
</style>