<template>
    <div class="contentContainer">
        <div class="mainbody content-detail">
            <el-row :gutter="0">
                    <el-col :xs="1" :sm="1" :md="1" :lg="1" :xl="5">
                        <div class="grid-content bg-purple">&nbsp;</div>
                    </el-col>
                    <el-col :xs="22" :sm="22" :md="22" :lg="22" :xl="14" class="main-details">
                        <el-row :gutter="15">
                            <el-col :xs="24" :sm="17" :md="17" :lg="17" >
                                <div class="hentry">
                                    <h2 class="content-title">{{article.doc.title}}&nbsp;<span v-show="article.doc.from == '2'" class="from">[转]</span></h2>
                                    <div class="content-author">
                                        <ul>
                                            <li class="author-name">
                                                {{article.doc.author ? article.doc.author.userName:article.doc.uAuthor.userName}}
                                            </li>
                                            <li>
                                                <span class="dot">&nbsp;•&nbsp;</span>{{cateName}}
                                            </li>
                                            <li>
                                                <span class="dot">&nbsp;•&nbsp;</span>{{article.doc.date}}
                                            </li>
                                            <li>
                                                <span class="dot">&nbsp;•&nbsp;</span>{{article.doc.clickNum}}&nbsp;次阅读
                                            </li>
                                        </ul>
                                    </div>
                                    <div v-html="article.doc.comments" class="content-main">
                                    </div>
                                    <div class="meta-bottom">
                                        <el-row :gutter="10">
                                        <el-col :xs="24" :sm="14" :md="14" :lg="14" :xl="14">
                                            <!-- <div class="like"> <el-button type="primary" plain  @click="likeIt(article.doc._id)"><i class="fa fa-heart-o"></i>&nbsp;喜欢 ({{article.doc.likeNum}})</el-button></div> -->
                                            <div class="meta-tags" v-if="article.doc.tags && article.doc.tags.length>0">
                                                <el-button type="primary" @click="searchByTag(tag.name)" plain v-for="tag in article.doc.tags" size="mini" :key="tag._id">{{tag.name}}</el-button>
                                            </div>
                                        </el-col>
                                        <el-col :xs="24" :sm="10" :md="10" :lg="10" :xl="10">
                                            <div class="share-group" v-if="systemConfig.data">
                                                <ul>
                                                    <li class="like">
                                                        <i class="fa fa-heart" @click="likeIt(article.doc._id)"></i>&nbsp;<span>{{article.doc.likeNum}}</span>
                                                    </li>
                                                    <li class="qq" @click="shareToQq(article.doc)">
                                                        <a><i class="fa fa-qq"></i></a>
                                                    </li>
                                                    <el-popover
                                                    ref="popover1"
                                                    placement="top-start"
                                                    width="200"
                                                    trigger="click"
                                                    popper-class="prop-wechat"
                                                    content="这是一段内容,这是一段内容,这是一段内容,这是一段内容。">
                                                     <template slot-scope="scope">
                                                         <h5>打开微信“扫一扫”，打开网页后点击屏幕右上角分享按钮</h5>
                                                         <img :src="'/api/qrImg?detailLink='+systemConfig.data[0].siteDomain+'/details/'+article.doc._id+'.html'" :alt="article.doc.title">
                                                     </template>
                                                    </el-popover>
                                                    <li class="wechat">
                                                        <a v-popover:popover1>
                                                            <i class="fa fa-wechat"></i>
                                                        </a>
                                                    </li>
                                                    <li class="weibo">
                                                        <a :href="'http://service.weibo.com/share/share.php?url='+systemConfig.data[0].siteDomain+'/details/'+article.doc._id+'.html&amp;title='+article.doc.discription+'&amp;pic='+((article.doc.sImg).indexOf('cdn') > -1 ?'':systemConfig.data[0].siteDomain)+article.doc.sImg+'&amp;appkey=902932546 target=_blank'">
                                                        <i class="fa fa-weibo"></i>
                                                        </a>
                                                    </li>
                                                </ul>
                                            </div>
                                        </el-col>
                                        </el-row>
                                    </div>
                                    <RandomArticle :articles="article.randomArticles" />
                                    <Messages :userMessageList="messages.data" :contentId="article.doc._id" />
                                </div>
                            </el-col>
                            <el-col :xs="0" :sm="7" :md="7" :lg="7" class="content-mainbody-right">
                                <div class="grid-content bg-purple-light title">
                                    <CatesMenu :typeId="typeId" />
                                    <RecentContents :recentItems="recentArticle" />
                                </div>
                            </el-col>
                        </el-row>
                    </el-col>
                    <el-col :xs="1" :sm="1" :md="1" :lg="1" :xl="5">
                        <BackTop/>
                    </el-col>
                </el-row>
        </div>
    </div>
</template>

<script lang="babel">
    import {
        mapGetters
    } from 'vuex'
    import metaMixin from '~mixins'
    import Messages from '../components/Messages.vue'
    import RandomArticle from '../components/RandomArticle.vue'
    import RecentContents from '../components/RecentContents.vue'
    import SearchBox from '../components/SearchBox.vue'
    import RecommendContents from '../components/RecommendContents.vue'
    import CatesMenu from '../components/CatesMenu.vue'
    import AdsPannel from '../components/AdsPannel.vue'
    import BackTop from '../components/BackTop.vue'
    import api from "~api";
    export default {
        name: 'frontend-article',
        async asyncData({ store, route }) {
            const { path, params: { id } } = route;
            let params = {}, currentId = '';
            if (id) {
                if (id.indexOf('html') > 0) {
                    currentId = id.substr(0, id.length - 5);
                } else {
                    currentId = id;
                }
            }
            store.dispatch('frontend/article/getRecContentList', { typeId: 'indexPage', pageSize: 10})
            store.dispatch('global/message/getUserMessageList',{ contentId: currentId, pageSize: 999})
            store.dispatch('frontend/article/getRecentContentList')
            await store.dispatch(`frontend/article/getArticleItem`, { id: currentId, path })
        },
        mixins: [metaMixin],
        beforeRouteUpdate(to, from, next) {
            if (to.path !== from.path) this.$options.asyncData({
                store: this.$store,
                route: to
            })
            next()
        },
        computed: {
            ...mapGetters({
                article: 'frontend/article/getArticleItem',
                reclist: 'frontend/article/getRecContentList',
                messages: 'global/message/getUserMessageList',
                recentArticle: 'frontend/article/getRecentContentList',
                loginState: 'frontend/user/getSessionState',
                systemConfig: 'global/footerConfigs/getSystemConfig'
            }),
            cateName() {
                let catesArr = this.article.doc.categories;
                if (typeof catesArr === 'object' && catesArr.length > 1) {
                    return catesArr[catesArr.length - 1].name
                } else {
                    return '其它'
                }
            },
            typeId(){
                let catesArr = this.article.doc.categories;
                if (typeof catesArr === 'object' && catesArr.length > 1) {
                    return catesArr[0]._id
                } else {
                    return 'indexPage'
                }
            }
        },
        components: {
            Messages,
            RandomArticle,
            RecentContents,
            SearchBox,
            RecommendContents,
            CatesMenu,
            AdsPannel,
            BackTop
        },
        methods: {
            addTarget(content) {
                if (!content) return ''
                return content.replace(/<a(.*?)href="http/g, '<a$1target="_blank" href="http')
            },
            likeIt(itemId){
                if (!this.loginState.logined) {
                    this.$router.push('/users/login');
                }else{
                   api.get("content/updateLikeNum", { contentId: itemId }).then(result => {
                        let data = result.data;
                        if (data.state == "success") {
                            this.article.doc.likeNum = data.likeNum;
                        } else {
                            this.$message({
                                    message: data.message,
                                    type: 'error'
                                });
                        }
                    }).catch((err) => {
                            this.$message.error(err.response.data.error)
                    }); 
                }  
            },
            searchByTag(name){
                this.$router.push("/tag/" + name);
            },
            shareToQq(content){
                let { title, discription, _id, sImg } = content;
                let url = this.systemConfig.data[0].siteDomain+'/details/' + _id;
                let picurl = (sImg.indexOf('cdn') > -1 ? '' : this.systemConfig.data[0].siteDomain) + sImg;
                let shareqqzonestring='http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?summary='+title+'.'+discription+'&url='+url+'&pics='+picurl;
                window.open(shareqqzonestring,'newwindow','height=400,width=400,top=100,left=100');
            }
        },
        mounted() {
            // this.$options.asyncData({store: this.$store})
        },
        metaInfo() {
            const { title, discription, tags } = this.article.doc;
            let tagArr = ['doracms'];
            if(tags){
                tagArr = tags.map((item,index)=>{
                    return item ? item.name : 'doracms'
                })
            }
            return {
                title,
                titleTemplate: '%s | 前端开发俱乐部',
                meta: [
                    { vmid: 'description', name: 'description', content: discription },
                    { vmid: 'keywords', name: 'keywords', content: tagArr.join() }
                ]
            }
        }
    }

</script>
<style lang="scss">

</style>
