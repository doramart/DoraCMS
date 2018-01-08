<template>
    <div>
      <div v-if="dataList.length>0">
        <ul class="userContentList" >
          <li v-for="item in dataList" :key="item._id">
              <router-link class="editItem" :to="{path: '/users/editContent/'+item._id}">编辑</router-link>
              <h2 class="item-title">
                <span :class="item.state?'green':'yellow'">{{item.state?'[已发布]':'[待审核]'}}</span>
                <router-link v-if="item.state" :to="{path: '/details/'+item._id+'.html'}">{{item.title}}</router-link>
                <span v-else>{{item.title}}</span>
              </h2>
              <div class="item-excerpt">
                {{item.discription}}
              </div>
              <ul class="post-meta">
                  <li>
                      <i class="fa fa-clock-o" aria-hidden="true"></i>&nbsp;&nbsp;{{item.date}}</li>
                  <li>
                      <i class="fa fa-eye" aria-hidden="true"></i>&nbsp;&nbsp;{{item.clickNum}}</li>
                  <li>
                      <i class="fa fa-comment" aria-hidden="true"></i>&nbsp;&nbsp;{{item.commentNum}}</li>
              </ul>
          </li>
      </ul>
    </div>
    </div>
</template>

<script>
import api from "~api";
export default {
  props: {
    dataList: Array,
    userInfo: Object
  },
  data() {
    return {
      loading: false,
      multipleSelection: []
    };
  },

  methods: {}
};
</script>

<style lang="scss">
.replyList {
  li {
    font-size: 14px;
    position: relative;
    padding-left: 15px;
    border-bottom: 1px dashed #ededed;
    blockquote {
      color: #475669;
    }
    time {
      float: right;
      color: #8492a6;
      font-size: 12px;
      margin-right: 30px;
    }
  }
}
</style>
