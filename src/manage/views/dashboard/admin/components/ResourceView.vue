<template>
  <div class="resource-details">
      <div v-if="resource && resource.docs.length > 0">
        <div v-for="cate in resource.docs" :key="cate._id">
          <!-- 主分类 -->
          <h3 class="cate-title">{{generateTitle(cate.label)}}</h3>
          <div v-for="(childCate,index) in cate.children" :key="'x_'+index">
            <!-- 子类 -->
            <el-row :gutter="10" style="margin:5px 0;">
              <el-col :xs="4" :sm="4" :md="4" :lg="4" :xl="4">
                  <h4 class="child-cate-title">{{generateTitle(childCate.label)}}</h4>
              </el-col>
              <el-col :xs="20" :sm="20" :md="20" :lg="20" :xl="20">
                <ul class="resource-list">
                  <li v-for="(resource,index) in childCate.children" :key="'r_'+index">
                    <i :class="resource.hasPower ? 'fa fa-check-circle' : 'fa fa-minus-circle'" :style="resource.hasPower ? green : red"></i>
                    {{generateTitle(resource.label)}}
                  </li>
                </ul>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>
      <div v-else>
          {{$t('main.noMessages')}}
      </div>
  </div>
</template>
<script>
import { generateTitle } from "@/utils/i18n";

export default {
  props: ["resource"],
  data() {
    return {
      green: { color: "#13CE66" },
      red: { color: "#FF4949" }
    };
  },
  methods: {
    generateTitle
  }
};
</script>
<style lang="scss">
.resource-details {
  margin-top: -30px;
  h3 {
    font-size: 14px;
    margin: 10px auto;
    border-bottom: 1px solid #edf2fc;
  }
  h4 {
    font-size: 12px;
    margin: 0;
    font-weight: 500;
  }
  .resource-list {
    margin: 0;
    padding: 0;
    li {
      display: inline-block;
      list-style-type: none;
      font-size: 12px;
      margin-right: 10px;
    }
  }
}
</style>


