<template>
  <div class="tabs" style="margin:10px 15px;">
    <el-tabs
      v-model="editableTabsValue"
      type="card"
      @tab-click="handleTabClick"
      @edit="handleTabEdit"
    >
      <el-tab-pane
        :closable="item.path != '/'"
        v-for="item in tabs"
        :key="item.path"
        :label="item.name"
        :name="item.path"
      >
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { filter, isEmpty } from 'lodash';

export default {
  data() {
    return {
      editableTabsValue: null,
    };
  },
  computed: {
    ...mapGetters(['tabs', 'activeTab', 'singleTabs']),
  },
  methods: {
    handleTabClick(value, action) {
      let targetPath = value.name;
      if (targetPath) {
        this.editableTabsValue = targetPath;
        this.$router.push(targetPath);
      }
    },
    // tab被关闭
    handleTabEdit(value, action) {
      if (action == "remove") {
        if (this.tabs.length == 1) {
          this.$router.push(this.$root.adminBasePath + "/dashboard");
        } else {
          if (this.$route.path == value) {
            let leftTabs = filter(this.tabs, (item) => {
              return item.path != value;
            });
            let nextTabs = leftTabs[leftTabs.length - 1].path;
            if (nextTabs.indexOf(this.$root.adminBasePath) < 0) {
              this.$router.push(this.$root.adminBasePath + "/dashboard");
            } else {
              this.$router.push(
                this.$root.adminBasePath +
                  "/" +
                  nextTabs.split(this.$root.adminBasePath + "/")[1]
              );
            }
          }
        }
        this.$store.dispatch("user/setTabs", {
          to: { path: value },
          action: "remove",
        });
      }
    },
  },
  watch: {
    activeTab(value){
      if(!isEmpty(value)){
        this.editableTabsValue = value.path
      }
    },
    tabs(value) {
      if (value && value.length == 1) {
        this.editableTabsValue = value[0].path;
      } else {
        if (this.tabs.length > 0) {
          this.editableTabsValue = this.tabs[this.tabs.length - 1].path;
        }
      }
    },
    singleTabs() {
      if (this.$root && this.$root.eventBus) {
        setTimeout(() => {
          this.$root.eventBus.$emit("handleTabInfo", this.singleTabs);
        }, 1200);
      }
    },
  },
  mounted() {},
};
</script>
<style scoped>
/deep/.el-tabs--card > .el-tabs__header .el-tabs__nav {
  border: none;
}
/deep/.el-tabs--card > .el-tabs__header {
  border: none;
  margin-bottom: 0;
}
/deep/.el-tabs--card > .el-tabs__header .el-tabs__item:first-child {
  margin-left: 0;
}
/deep/.el-tabs--card > .el-tabs__header .el-tabs__item {
  background-color: white;
  border: none;
  height: 32px;
  line-height: 32px;
  margin-left: 6px;
}
</style>
