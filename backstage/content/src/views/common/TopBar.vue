<template>
  <div class="dr-toolbar">
    <el-col :xs="14" :md="6" class="option-button">
      <el-button size="small" type="primary" plain @click="addContent('content')" round>
        <svg-icon icon-class="icon_add" />
      </el-button>
      <el-tooltip class="item" effect="dark" content="绑定编辑" placement="top">
        <el-button size="small" type="warning" plain @click="directUser('content')" round>
          <svg-icon icon-class="direct_user" />
        </el-button>
      </el-tooltip>
      <el-tooltip class="item" effect="dark" content="批量移动" placement="top">
        <el-button size="small" type="success" plain round @click="moveCate('content')">
          <svg-icon icon-class="icon_move" />
        </el-button>
      </el-tooltip>
      <el-tooltip class="item" effect="dark" content="回收站" placement="top">
        <el-button size="small" type="info" plain round @click="showDraft('content')">
          <svg-icon icon-class="icon_collect" />
        </el-button>
      </el-tooltip>
      <el-button size="small" type="danger" plain round @click="branchDelete('content')">
        <svg-icon icon-class="icon_delete" />
      </el-button>

      <!-- TOPBARLEFT -->
    </el-col>
    <el-col :xs="10" :md="18">
      <div class="dr-toolbar-right">
        <div v-if="device != 'mobile'" style="display:inline-block">
          <el-cascader
            placeholder="请选择类别"
            class="cateSelect"
            size="small"
            expandTrigger="hover"
            :options="contentCategoryList.docs"
            v-model="pageInfo.categories"
            @change="handleChangeCategory"
            :props="categoryProps"
            clearable
            change-on-select
          ></el-cascader>
          <el-select
            class="dr-searchInput"
            v-model="pageInfo.uAuthor"
            size="small"
            clearable
            filterable
            remote
            reserve-keyword
            placeholder="请输入用户名"
            @change="changeUserOptions"
            :remote-method="remoteMethod"
            :loading="loading"
          >
            <el-option
              v-for="item in selectUserList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
          <el-input
            class="dr-searchInput"
            style="width:180px"
            size="small"
            :placeholder="$t('topBar.keywords')"
            v-model="pageInfo.searchkey"
            suffix-icon="el-icon-search"
            @keyup.enter.native="searchResult"
          ></el-input>
        </div>

        <div class="dr-select-box">
          <el-select size="small" @change="changePostOptions" v-model="authPost" placeholder="请选择">
            <el-option
              v-for="item in authPostOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </div>
      </div>
    </el-col>
  </div>
</template>
<script>
import { mapGetters, mapActions } from "vuex";
import { deleteContent, regUserList } from "@/api/content";
export default {
  props: {
    device: String,
    pageInfo: Object,
    type: String,
    ids: Array
  },
  data() {
    return {
      loading: false,
      selectUserList: [],
      searchkey: "",
      authPost: "0",
      categories: "",
      authPostOptions: [
        {
          value: "0",
          label: "全部"
        },
        {
          value: "1",
          label: "待审核"
        }
      ],
      categoryProps: {
        value: "_id",
        label: "name",
        children: "children"
      }
    };
  },
  computed: {
    ...mapGetters(["contentCategoryList"])
  },
  methods: {
    handleChangeCategory(value) {
      let _this = this;
      if (value && value.length > 0) {
        let categories = this.pageInfo ? this.pageInfo.categories : "";
        this.$store.dispatch(
          "content/getContentList",
          Object.assign({}, _this.pageInfo, {
            categories: value[value.length - 1]
          })
        );
      } else {
        this.$store.dispatch("content/getContentList", _this.pageInfo);
      }
    },
    addContent() {
      this.$store.dispatch("content/showContentForm");
      this.$router.push(this.$root.adminBasePath + "/content/addContent");
    },
    directUser() {
      this.$store.dispatch("content/showDirectUserForm");
    },
    moveCate() {
      this.$store.dispatch("content/showMoveCateForm");
    },
    showDraft() {
      this.$store.dispatch("content/getDraftContentList");
      this.$store.dispatch("content/showDraftListDialog");
    },
    branchDelete(target) {
      let _this = this;
      if (_.isEmpty(_this.ids)) {
        this.$message({
          type: "info",
          message: this.$t("validate.selectNull", {
            label: this.$t("main.target_Item")
          })
        });
        return false;
      }
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
          let ids = _this.ids.join();
          return deleteContent({
            ids,
            draft: "1"
          });
        })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("content/getContentList");
            this.$message({
              message: `${this.$t("main.scr_modal_del_succes_info")}`,
              type: "success"
            });
          } else {
            this.$message.error(result.message);
          }
        })
        .catch(err => {
          this.$message({
            type: "info",
            message: this.$t("main.scr_modal_del_error_info")
          });
        });
    },
    searchResult(ev) {
      let searchkey = this.pageInfo ? this.pageInfo.searchkey : "";
      this.$store.dispatch("content/getContentList", {
        searchkey
      });
    },
    remoteMethod(query) {
      if (query !== "") {
        this.loading = true;
        let _this = this;
        this.queryUserListByParams({ searchkey: query, group: "1" });
      } else {
        this.selectUserList = [];
      }
    },
    queryUserListByParams(params = {}) {
      let _this = this;
      regUserList(params)
        .then(result => {
          let specialList = result.data.docs;
          if (specialList) {
            _this.selectUserList = specialList.map(item => {
              return {
                value: item._id,
                label: item.userName
              };
            });
            _this.loading = false;
          } else {
            _this.selectUserList = [];
          }
        })
        .catch(err => {
          console.log(err);
          _this.selectUserList = [];
        });
    },
    changeUserOptions(value) {
      this.$store.dispatch("content/getContentList", { uAuthor: value });
    },
    changePostOptions(value) {
      if (value == "0") {
        this.$store.dispatch("content/getContentList");
      } else if (value == "1") {
        this.$store.dispatch("content/getContentList", { state: "1" });
      }
    }
    // TOPBARLEFTOPTION
  },
  components: {},
  mounted() {
    this.$store.dispatch("contentCategory/getContentCategoryList");
  }
};
</script>
<style lang="scss">
.cateSelect {
  margin-right: 10px;
}
</style>
