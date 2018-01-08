<template>
  <div>
    <PannelBox title="最新评论" className="rec-message-list" v-if="messagelist.data && messagelist.data.length>0">
        <ul>
            <li class="message-list" v-for="msg in messagelist.data" :key="msg._id">
                <div class="comment-info">
                    <a class="logo" href="#"><img :src="getAuthor(msg).logo" alt=""></a>
                    <a class="uname" href="#">{{getAuthor(msg).userName}}</a>
                    <span>{{msg.date}}</span>
                </div>
                <div class="comment-excerpt">
                    <p>{{msg.content | cutWords(35)}}</p>
                </div>
                <p class="comment-post">
                    评论于&nbsp;&nbsp;
                    <router-link class="title" :to="'/details/'+msg.contentId._id+'.html'">{{getTitle(msg) | cutWords(24)}}</router-link> 
                </p>
            </li>
        </ul>
    </PannelBox>
  </div>
</template>

<script>
import PannelBox from "./PannelBox.vue";

export default {
  props: ["messagelist"],
  components: {
    PannelBox
  },
  methods: {
    getAuthor(item) {
      return item.author ? item.author : item.adminAuthor;
    },
    getTitle(msg) {
      return msg.contentId.stitle ? msg.contentId.stitle : msg.contentId.title;
    }
  }
};
</script>

