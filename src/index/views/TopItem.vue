<template>
    <article class="content-item">
        <el-row :gutter="30" class="row-list">
          <el-col :xs="24" :sm="8" :md="8" :lg="8" class='image'>
              <div class="grid-content bg-purple contentImg">
                <div v-if="item.categories">
                    <div v-if="item.categories.length>1">
                        <router-link class="item-category" :to="{path: '/'+(item.categories)[item.categories.length-1].defaultUrl+ '___'+(item.categories)[item.categories.length-1]._id}">{{(item.categories)[item.categories.length-1].name}}</router-link>
                    </div>
                    <div v-else-if="item.categories.length == 1">
                        <router-link class="item-category" :to="{path: '/'+(item.categories)[0].defaultUrl+ '___'+(item.categories)[0]._id}">{{(item.categories)[0].name}}</router-link>
                    </div>
                </div>
                  <router-link :to="'/details/'+item._id+'.html'" class="continue-reading">
                      <img :src="item.sImg" :alt="item.title" />
                  </router-link>
              </div>
          </el-col>
          <el-col :xs="24" :sm="16" :md="16" :lg="16">
              <div class="discription">
                  <h2>
                      <router-link :to="'/details/'+item._id+'.html'" class="continue-reading">{{item.title}}</router-link>
                  </h2>
                  <div class="dis">{{item.discription | cutWords(90)}}</div>
                  <ul class="post-meta">
                      <li class="author">
                        <a class="logo">
                            <img :src="renderAuthor.logo" :alt="renderAuthor.userName">
                        </a>
                        <span>{{renderAuthor.userName}}</span>
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

</style>

<script>
export default {
  name: "index-item",
  serverCacheKey: props => {
    return `article-item-${props.item._id}`;
  },
  computed: {
    renderAuthor() {
      return this.item.author ? this.item.author : this.item.uAuthor;
    }
  },
  props: ["item"]
};
</script>