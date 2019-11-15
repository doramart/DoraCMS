<template>
  <el-card class="box-card-component" style="margin-left:8px;">
    <div slot="header" class="box-card-header">
      <img src="https://wpimg.wallstcn.com/e7d23d71-cf19-4b90-a1cc-f56af8c0903d.png" />
    </div>
    <div style="position:relative;">
      <pan-thumb :image="loginState.userInfo.logo" class="panThumb" />
      <mallki class-name="mallki-text" :text="loginState.userInfo.userName" />
      <div class="info-pannel">
        <ul>
          <li>
            <label>{{$t('main.lastLoginTime')}}：</label>
            {{renderLogs.date}}
          </li>
          <li>
            <label>{{$t('main.lastLoginIp')}}：</label>
            {{renderLogs.ip}}
          </li>
          <li>
            <label>{{$t('main.myPower')}}：</label>
            <el-button size="mini" type="text" @click="showMyResourceBox">{{$t('main.seeDetails')}}</el-button>
          </li>
        </ul>
      </div>
    </div>
  </el-card>
</template>

<script>
import { mapGetters } from "vuex";
import PanThumb from "@/components/PanThumb";
import Mallki from "@/components/TextHoverEffect/Mallki";

export default {
  props: ["basicInfo"],
  components: { PanThumb, Mallki },

  filters: {
    statusFilter(status) {
      const statusMap = {
        success: "success",
        pending: "danger"
      };
      return statusMap[status];
    }
  },
  data() {
    return {
      statisticsData: {
        article_count: 1024,
        pageviews_count: 1024
      }
    };
  },
  methods: {
    showMyResourceBox() {
      this.$emit("showMyResourceBox");
    }
  },
  computed: {
    ...mapGetters(["loginState"]),
    renderLogs() {
      let logs = {
        ip: "127.0.0.1",
        date: "1970-01-01 00:00:00"
      };
      if (this.basicInfo.loginLogs && this.basicInfo.loginLogs[0]) {
        logs = {
          date: this.basicInfo.loginLogs[0].date,
          ip: this.basicInfo.loginLogs[0].logs.split(":")[1]
        };
      }
      return logs;
    }
  },
  mounted() {
    this.$store.dispatch("dashboard/loginState", {
      state: true
    });
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" >
.box-card-component {
  .el-card__header {
    padding: 0px !important;
  }
}
</style>
<style rel="stylesheet/scss" lang="scss" scoped>
.box-card-component {
  .box-card-header {
    position: relative;
    height: 220px;
    img {
      width: 100%;
      height: 100%;
      transition: all 0.2s linear;
      &:hover {
        transform: scale(1.1, 1.1);
        filter: contrast(130%);
      }
    }
  }
  .mallki-text {
    position: absolute;
    top: 0px;
    right: 0px;
    font-size: 20px;
    font-weight: bold;
  }
  .panThumb {
    z-index: 100;
    height: 70px !important;
    width: 70px !important;
    position: absolute !important;
    top: -45px;
    left: 0px;
    border: 5px solid #ffffff;
    background-color: #fff;
    margin: auto;
    box-shadow: none !important;
    /deep/ .pan-info {
      box-shadow: none !important;
    }
  }
  .progress-item {
    margin-bottom: 10px;
    font-size: 14px;
  }

  .logo-pannel {
    border-bottom: 1px solid #edf2fc;
    padding-bottom: 12px;
    .logo {
      float: left;
      width: 100%;
      img {
        width: 50%;
        max-width: 60px;
        height: auto;
        border-radius: 50%;
      }
    }
    .name {
      float: right;
      width: 100%;
      h3 {
        font-size: 1.6em;
        color: #409eff;
        margin-top: 0.4rem;
        margin-bottom: 0.2rem;
      }
      span {
        color: #878d99;
        font-size: 13px;
      }
    }
  }
  .info-pannel {
    padding-top: 30px;
    ul {
      margin: 0;
      padding: 0;
      li {
        list-style-type: none;
        line-height: 30px;
        color: rgba(0, 0, 0, 0.45);
        font-size: 13px;
        label {
          display: inline-block;
          width: 100px;
          margin-right: 10px;
        }
        .el-button--text {
          padding: 0;
        }
      }
    }
  }
  @media only screen and (max-width: 1510px) {
    .mallki-text {
      display: none;
    }
  }
}
</style>
