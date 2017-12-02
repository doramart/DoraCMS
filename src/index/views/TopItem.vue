<template>
    <article class="content-item">
        
        <el-row :gutter="30">
          <el-col :xs="0" :sm="7" :md="7" :lg="7" hidden-xs-only>
                <div class="grid-content bg-purple contentImg">
                    <router-link :to="'/details/'+item._id+'.html'" class="continue-reading">
                        <img :src="item.sImg" :alt="item.title" />
                    </router-link>
                </div>
            </el-col>
            <el-col :xs="24" :sm="17" :md="17" :lg="17" class='discription'>
                <div class="grid-content bg-purple-light title">
                    <h2>
                        <router-link :to="'/details/'+item._id+'.html'" class="continue-reading">{{item.title}}</router-link>
                    </h2>
                    <div class="dis">{{item.discription | cutWords(90)}}</div>
                    <ul class="post-meta">
                        <li>
                            <div v-if="item.categories && item.categories.length>1">
                                <router-link :to="{path: '/'+(item.categories)[item.categories.length-1].defaultUrl+ '___'+(item.categories)[item.categories.length-1]._id}">{{(item.categories)[item.categories.length-1].name}}</router-link>
                            </div>
                        </li>
                        <li>
                            <i class="fa fa-clock-o" aria-hidden="true"></i>&nbsp;&nbsp;{{item.date}}</li>
                        <li>
                            <i class="fa fa-eye" aria-hidden="true"></i>&nbsp;&nbsp;{{item.clickNum}}</li>
                        <li>
                            <i class="fa fa-comment" aria-hidden="true"></i>&nbsp;&nbsp;{{item.commentNum}}</li>
                    </ul>
                </div>
            </el-col>
            
        </el-row>
    </article>
</template>
<style lang="scss">
.content-item {
  .post-angle {
    position: absolute;
    left: -10px;
    height: 21px;
    color: #fff;
    text-align: center;
    background-color: #f63756;
    line-height: 24px;
    padding: 0 10px;
    z-index: 101;
    top: 0px;
    font-size: 13px;
  }
  .post-angle:after {
    content: " ";
    position: absolute;
    left: 0;
    top: 21px;
    width: 0;
    height: 0;
    border-top: 6px solid #cd213d;
    border-left: 10px solid transparent;
  }
  .contentImg {
    img {
      width: 100%;
      min-height: 6rem;
      border-radius: 4px;
      border: 1px solid #f0f0f0;
    }
    // margin-right: 30px;
    height: auto;
    display: block;
    position: relative;
    .content-cate {
      position: absolute;
      top: 0.4rem;
      left: 0.4rem;
      display: block;
      padding: 0 0.5rem;
      color: #fff;
      background: rgba(0, 0, 0, 0.5);
      font-size: 0.6rem;
      text-align: center;
      border-radius: 1rem;
      z-index: 11;
    }
  }
  .discription {
    text-align: left;
    .post-meta {
      a:link,
      a:visited {
        color: #3ca5f6;
      }
      li {
        display: inline-block;
        font-size: 13px;
        color: #b4b4b4;
        margin: 10px 10px 10px 0;
      }
    }
    .title {
      h2 {
        margin: 0;
        font-size: 18px;
        word-break: break-all;
        font-weight: 700;
      }
    }
    .dis {
      margin: 10px 0;
      font-size: 13px;
      color: #333333;
    }
  }
}
</style>

<script>
export default {
  name: "index-item",
  serverCacheKey: props => {
    return `article-item-${props.item._id}`;
  },
  props: ["item"]
};
</script>