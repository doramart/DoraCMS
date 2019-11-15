<template>
  <div :class="classObj" class="adminResource">
    <div class="main-container">
      <ResourceForm :device="device" :dialogState="formState"></ResourceForm>
      <SelectParentForm
        :device="device"
        :selectDialogState="selectFormState"
        :parentResource="parentResource"
      ></SelectParentForm>
      <el-row class="dr-datatable">
        <el-col :span="24">
          <TopBar type="adminResource"></TopBar>
          <ResourceTree :treeData="adminResourceList.docs" pageType="adminResource"></ResourceTree>
          <el-tooltip placement="top" content="tooltip">
            <back-to-top
              :custom-style="myBackToTopStyle"
              :visibility-height="300"
              :back-position="50"
              transition-name="fade"
            />
          </el-tooltip>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import ResourceForm from "./resourceForm";
import SelectParentForm from "./selectParentForm";
import ResourceTree from "./resourceTree";
import TopBar from "../common/TopBar.vue";
import BackToTop from "@/components/BackToTop";
import { mapGetters, mapActions } from "vuex";
import { initEvent } from "@root/publicMethods/events";

export default {
  name: "index",
  data() {
    return {
      sidebarOpened: true,
      device: "desktop",
      myBackToTopStyle: {
        right: "0px",
        bottom: "50px",
        width: "40px",
        height: "40px",
        "border-radius": "4px",
        "line-height": "45px", // 请保持与高度一致以垂直居中 Please keep consistent with height to center vertically
        background: "#e7eaf1" // 按钮的背景颜色 The background color of the button
      }
    };
  },
  components: {
    TopBar,
    ResourceForm,
    ResourceTree,
    BackToTop,
    SelectParentForm
  },
  methods: mapActions([]),
  computed: {
    ...mapGetters(["adminResourceList"]),
    formState() {
      return this.$store.getters.adminResourceFormState;
    },
    selectFormState() {
      return this.$store.getters.adminSelectResourceFormState;
    },
    parentResource() {
      let parentResource = this.adminResourceList.docs.map(item => {
        return {
          label: item.comments,
          value: item._id
        };
      });
      return parentResource;
    },
    classObj() {
      return {
        hideSidebar: !this.sidebarOpened,
        openSidebar: this.sidebarOpened,
        withoutAnimation: "false",
        mobile: this.device === "mobile"
      };
    }
  },
  mounted() {
    initEvent(this);
    this.$store.dispatch("adminResource/getAdminResourceList");
  }
};
</script>

<style lang="">
</style>