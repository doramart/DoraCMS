<template>
    <div>
        <el-table align="center" v-loading="loading" ref="multipleTable" :data="dataList" tooltip-effect="dark" style="width: 100%" @selection-change="handleContentSelectionChange">
            <el-table-column type="selection" width="55">
            </el-table-column>
            <el-table-column prop="isTop" :label="$t('contents.rec')" width="55" show-overflow-tooltip>
                <template slot-scope="scope">
                    <i @click="topContent(scope.$index, dataList)" :class="scope.row.isTop === 1 ? 'fa fa-star' : 'fa fa-star-o'" :style="scope.row.isTop === 1 ? yellow : gray"></i>
                </template>
            </el-table-column>
            <el-table-column prop="title" :label="$t('contents.title')" width="200" show-overflow-tooltip>
                <template slot-scope="scope" >
                  <div v-if="scope.row.type == '2'">
                    <a :href="'/details/'+scope.row._id+'.html'" target="_blank">{{scope.row.discription | cutWords(20)}}</a>
                  </div>
                  <div v-else-if="scope.row.type == '3'">
                    {{scope.row.translate | cutWords(20)}}
                  </div>
                  <div v-else>
                    <div v-if="scope.row.state"><a :href="'/details/'+scope.row._id+'.html'" target="_blank">{{scope.row.title}}</a></div>
                    <div v-else>{{scope.row.title}}</div>
                  </div>
                </template>
            </el-table-column>
            <el-table-column prop="date" :label="$t('contents.date')" width="180">
                <template slot-scope="scope">{{scope.row.updateDate}}</template>
            </el-table-column>
            <el-table-column prop="categories" :label="$t('contents.categories')" show-overflow-tooltip width="120">
                <template slot-scope="scope">{{typeof scope.row.categories == 'object' && scope.row.categories.length > 1 ? scope.row.categories[scope.row.categories.length-1].name : (scope.row.categories[0] ? scope.row.categories[0].name:'其它') }}</template>
            </el-table-column>
            <el-table-column prop="from" :label="$t('contents.from')" show-overflow-tooltip>
                <template slot-scope="scope">{{scope.row.from === '1'?'原创':(scope.row.from === '2'?'转载':'投稿')}}</template>
            </el-table-column>
            <el-table-column prop="clickNum" :label="$t('contents.clickNum')" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="commentNum" :label="$t('contents.commentNum')" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="state" :label="$t('contents.enable')" show-overflow-tooltip>
                <template slot-scope="scope">
                    <i :class="scope.row.state ? 'fa fa-check-circle' : 'fa fa-minus-circle'" :style="scope.row.state ? green : red"></i>
                </template>
            </el-table-column>
            <el-table-column prop="author.name" :label="$t('contents.author')" show-overflow-tooltip>
                <template slot-scope="scope">{{scope.row.from === '3' ? (scope.row.uAuthor?scope.row.uAuthor.userName:'') : (scope.row.author?scope.row.author.userName:"")}}</template>
            </el-table-column>
            <el-table-column :label="$t('main.dataTableOptions')" width="150" fixed="right">
                <template slot-scope="scope">
                    <el-button size="mini" type="primary" plain round @click="editContentInfo(scope.$index, dataList)">
                        <i class="fa fa-edit"></i>
                    </el-button>
                    <el-button size="mini" type="danger" plain round icon="el-icon-delete" @click="deleteContent(scope.$index, dataList)"></el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>
<style lang="scss">
.fa-star {
  cursor: pointer;
}

.fa-star-o {
  cursor: pointer;
}
</style>
<script>
import services from "../../store/services.js";
export default {
  props: {
    dataList: Array,
    pageInfo: Object
  },
  data() {
    return {
      loading: false,
      multipleSelection: [],
      yellow: {
        color: "#F7BA2A"
      },
      gray: {
        color: "#CCC"
      },
      green: { color: "#13CE66" },
      red: { color: "#FF4949" }
    };
  },

  methods: {
    handleContentSelectionChange(val) {
      if (val && val.length > 0) {
        let ids = val.map((item, index) => {
          return item._id;
        });
        this.multipleSelection = ids;
        this.$emit("changeContentSelectList", ids);
      }
    },
    editContentInfo(index, rows) {
      let rowData = rows[index];
      let categoryIdArr = [],
        tagsArr = [];
      rowData.categories &&
        rowData.categories.map((item, index) => {
          categoryIdArr.push(item._id);
        });
      rowData.tags &&
        rowData.tags.map((item, index) => {
          tagsArr.push(item._id);
        });
      rowData.categories = categoryIdArr;
      rowData.tags = tagsArr;
      this.$store.dispatch("showContentForm", {
        edit: true,
        formData: rowData
      });
      this.$router.push("/editContent/" + rowData._id);
    },
    topContent(index, rows) {
      let contentData = rows[index];
      contentData.isTop = contentData.isTop == 1 ? 0 : 1;
      services.updateContent(contentData).then(result => {
        if (result.data.status === 200) {
          this.$store.dispatch("getContentList", this.pageInfo);
        } else {
          this.$message.error(result.data.message);
        }
      });
    },
    deleteContent(index, rows) {
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
          return services.deleteContent({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.data.status === 200) {
            Object.assign(this.pageInfo);
            this.$store.dispatch("getContentList", this.pageInfo);
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
  },
  computed: {}
};
</script>
