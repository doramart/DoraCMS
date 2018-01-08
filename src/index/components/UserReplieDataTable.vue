<template>
    <ul class="replyList">
        <li v-for="item in dataList" :key="item._id">
            <time>{{item.date}}</time>
            <h4>
                <a href="#">{{userInfo.userName}}</a>&nbsp;发表在&nbsp;
                <router-link :to="'/details/'+item.contentId._id+'.html'">{{item.contentId.stitle}}</router-link>
            </h4>
            <blockquote>{{item.content}}</blockquote>
        </li>
    </ul>
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
  padding: 15px;
  background-color: #ffffff;
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
