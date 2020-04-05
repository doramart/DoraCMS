<template>
  <div :class="'dr-contentCoverForm ' + device">
    <el-dialog
      :xs="20"
      :sm="20"
      :md="4"
      :lg="4"
      :xl="4"
      class="cover-dialog"
      title="选择封面"
      width="60%"
      :visible.sync="dialogState.show"
      :close-on-click-modal="false"
    >
      <el-tabs
        v-model="currentType"
        style="height: 400px;"
        tab-position="top"
        @tab-click="handleTypeClick"
      >
        <el-tab-pane
          v-for="item in coverTypeList"
          :name="item._id"
          :key="item._id"
          :label="item.name"
        >
          <el-row :gutter="20" class="dialog-covers-list" style="padding-left:10px;">
            <el-col :xs="8" :md="3" v-for="item in contentCoverList.docs" :key="item._id">
              <div
                class="grid-img"
                :style="item.backgroundDefaultCss?JSON.parse(item.backgroundDefaultCss):''"
                @click="selectThisCover(item)"
              >
                <img :src="item.cover" />
                <div class="cover" :style="formState.formData.cover==item._id?coverActiveStyle:{}">
                  <span>
                    <svg-icon icon-class="icon_check_right" />已选择
                  </span>
                </div>
              </div>
            </el-col>
          </el-row>
          <CoverPagination :device="device" :pageInfo="contentCoverList.pageInfo"></CoverPagination>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>
<script>
import { updateContentEditor, regUserList } from "@/api/content";
import _ from "lodash";
import { mapGetters, mapActions } from "vuex";
import CoverPagination from "../common/CoverPagination.vue";
export default {
  props: {
    dialogState: Object,
    targetCover: Object,
    coverTypeList: Array,
    device: String
  },
  data() {
    return {
      targetCoverList: []
    };
  },
  computed: {
    ...mapGetters(["contentCoverList"]),
    formState() {
      return this.$store.getters.contentFormState;
    },
    coverActiveStyle() {
      return {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.4)",
        display: "block"
      };
    },
    currentType() {
      if (
        !_.isEmpty(this.contentCoverList) &&
        !_.isEmpty(this.contentCoverList.docs)
      ) {
        return this.contentCoverList.docs[0].type._id;
      } else {
        return "";
      }
    }
  },
  components: {
    CoverPagination
  },
  methods: {
    handleTypeClick(tab, event) {
      let targetCoverType = this.coverTypeList[tab.index];
      this.$store.dispatch("content/getContentCoverList", {
        type: targetCoverType._id,
        pageSize: 30
      });
    },
    selectThisCover(item) {
      if (!_.isEmpty(item)) {
        this.$emit("updateTargetCover", item);
        this.$store.dispatch("content/showContentForm", {
          edit: this.formState.edit,
          formData: Object.assign({}, this.formState.formData, {
            cover: item._id
          })
        });
        this.$store.dispatch("content/hideCoverListDialog");
      }
    }
  },
  mounted() {}
};
</script>
<style lang="scss" >
.cover-dialog {
  .el-dialog__body {
    padding-top: 0 !important;
  }
}

.dialog-covers-list {
  height: 300px;
  overflow: hidden;
  .el-col {
    height: 60px;
    margin-bottom: 15px;
    .grid-img {
      background: #000;
      border-radius: 4px;
      overflow: hidden;
      height: 100%;
      cursor: pointer;
      position: relative;
      .cover {
        display: none;
        span {
          position: absolute;
          top: 50%;
          left: 50%;
          display: inline-block;
          transform: translate(-50%, -50%);
          color: #fff;
          font-size: 12px;
          width: 60px;
          svg {
            margin-right: 4px;
          }
        }
      }
      img {
        width: 100%;
        height: 100%;
      }
    }
  }
  .preview {
    width: 400px;
    height: 269px;
    position: relative;
    padding-left: 0 !important;
    padding-right: 0 !important;
    .grid-img {
      overflow: hidden;
      height: 100%;
      .cover-title {
        overflow: hidden;
        word-break: break-word;
        font-family: fzlthjt;
      }
    }
  }
}
</style>
