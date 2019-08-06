<template>
  <div class="dash-box">
    <h2 class="dash-title">{{$t('main.nearMessages')}}</h2>
    <div class="dash-content message-pannel">
        <div v-if="messages && messages.length > 0">
            <div class="direct-chat-msg" v-for="msg in messages" :key="msg._id">
                <div class="direct-chat-info clearfix">
                    <span class="direct-chat-name pull-left">
                        <a href="#">{{msg.utype =='0'?msg.author.userName:msg.adminAuthor.userName}}</a>
                        {{$t('main.messageIn')}}
                        <a class="direct-chat-contentTitle" :href="'/details/'+msg.contentId._id+'.html'" target="_blank">{{msg.contentId.stitle | cutWords(20)}}</a> {{msg.utype =='0'?$t('main.messageSaid'):$t('main.messageReply')}}
                        <a href="#">{{msg.utype =='1'?(msg.replyAuthor ? msg.replyAuthor.userName : (msg.adminReplyAuthor ? msg.adminReplyAuthor.userName : '')) : ''}}</a>
                    </span>
                    <span class="direct-chat-timestamp pull-right">
                        <i class="fa fa-clock-o"></i>
                        <span>{{msg.date}}</span>
                    </span>
                </div>
               <random-logo :user="msg.author?msg.author:msg.adminAuthor"/>
                <div class="direct-chat-text" v-html="msg.content"></div>
            </div>
        </div>
        <div v-else>{{$t('main.noMessages')}}</div>
      </div>
  </div>
  
</template>

<script>
import RandomLogo from "@/components/RandomLogo";

export default {
  props: ["messages"],
  filters: {},
  data() {
    return {
      list: null
    };
  },
  components: {
    RandomLogo
  }
};
</script>
<style lang="scss">
.message-pannel {
  font-size: 14px;
  position: relative;
  overflow: hidden;
  color: #666;
}
.direct-chat-msg {
  margin-bottom: 20px;
  a:link,
  a:visited {
    color: #409eff;
  }
  .direct-chat-contentTitle {
    font-size: 14px;
  }
  .direct-chat-contentTitle:link,
  .direct-chat-contentTitle:visited {
    color: #878d99;
    font-style: italic;
  }
  .direct-chat-info {
    margin-bottom: 10px;
  }
  .direct-chat-timestamp {
    color: #b4bccc;
    font-size: 12px;
  }
  .direct-chat-img {
    border-radius: 50%;
    width: 35px;
    height: 35px;
    float: left;
  }
  .direct-chat-text {
    border-radius: 5px;
    position: relative;
    padding: 10px;
    margin: 5px 0 0 50px;
    color: #5a5e66;
    background-color: #edf2fc;
    font-size: 13px;
  }
  .direct-chat-text:after,
  .direct-chat-text:before {
    position: absolute;
    right: 100%;
    top: 15px;
    border: solid transparent;
    border-right-color: #edf2fc;
    content: " ";
    height: 0;
    width: 0;
    pointer-events: none;
    box-sizing: border-box;
  }
  .direct-chat-text:before {
    border-width: 6px;
    margin-top: -6px;
  }
  .direct-chat-text:after {
    border-width: 5px;
    margin-top: -5px;
  }
}
</style>
