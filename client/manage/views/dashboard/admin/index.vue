<template>
  <div class="dashboard-editor-container">
    <github-corner style="position: absolute; top: 0px; border: 0; right: 0;"/>

    <panel-group :basicInfo="basicInfo"/>
    <el-dialog
      width="55%"
      :title="$t('main.myPower')"
      :visible.sync="resourceShow"
      :close-on-click-modal="false"
    >
      <resource-view :resource="newSourceData"/>
    </el-dialog>
    <el-row :gutter="8">
      <el-col
        :xs="{span: 24}"
        :sm="{span: 24}"
        :md="{span: 24}"
        :lg="{span: 11}"
        :xl="{span: 12}"
        style="padding-right:8px;margin-bottom:30px;"
      >
        <transaction-table :messages="basicInfo.messages"/>
      </el-col>
      <el-col
        :xs="{span: 24}"
        :sm="{span: 12}"
        :md="{span: 12}"
        :lg="{span: 6}"
        :xl="{span: 6}"
        style="margin-bottom:30px;"
      >
        <user-list :regUsers="basicInfo.regUsers"/>
      </el-col>
      <el-col
        :xs="{span: 24}"
        :sm="{span: 12}"
        :md="{span: 12}"
        :lg="{span: 7}"
        :xl="{span: 6}"
        style="margin-bottom:30px;"
      >
        <box-card :basicInfo="basicInfo" @showMyResourceBox="showMyResource"/>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import GithubCorner from "@/components/GithubCorner";
import PanelGroup from "./components/PanelGroup";
import ResourceView from "./components/ResourceView.vue";
import TransactionTable from "./components/TransactionTable";
import UserList from "./components/UserList";
import BoxCard from "./components/BoxCard";
import { renderTreeData } from "@/store/modules/app";
import { mapGetters, mapActions } from "vuex";

export default {
  name: "DashboardAdmin",
  components: {
    GithubCorner,
    PanelGroup,
    ResourceView,
    TransactionTable,
    UserList,
    BoxCard
  },
  data() {
    return {
      resourceShow: false
    };
  },
  methods: {
    showMyResource() {
      this.resourceShow = true;
    }
  },
  computed: {
    ...mapGetters(["basicInfo", "loginState"]),
    newSourceData() {
      return renderTreeData({ docs: this.basicInfo.resources });
    }
  },
  mounted() {
    this.$store.dispatch("getSiteBasicInfo");
    localStorage.clear();
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.dashboard-editor-container {
  padding: 32px;
  background-color: rgb(240, 242, 245);
  .chart-wrapper {
    background: #fff;
    padding: 16px 16px 0;
    margin-bottom: 32px;
  }
}
</style>
