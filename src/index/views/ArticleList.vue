<template>
    <div>
        <div class="contentContainer">
            <div class="mainbody">
                <el-row :gutter="0">
                    <el-col :xs="1" :sm="1" :md="1" :lg="1" :xl="5">
                        <div class="grid-content bg-purple">&nbsp;</div>
                    </el-col>
                    <el-col :xs="22" :sm="22" :md="22" :lg="22" :xl="14" class="content-list">
                        <el-row :gutter="15">
                            <el-col :xs="24" :sm="17" :md="17" :lg="17" v-if="topics.data.length > 0">
                                <div class="top-ads" v-if="typeId == 'indexPage'">
                                    <el-row :gutter="15">
                                        <el-col :xs="24" :sm="19" :md="19" :lg="19" >
                                            <AdsPannel id="rk49YAOcb" v-if="typeId == 'indexPage'"/>
                                        </el-col>
                                        <el-col :xs="0" :sm="5" :md="5" :lg="5" >
                                            <TopRecoContents :reclist="reclist"/>
                                        </el-col>
                                    </el-row>
                                </div>
                                <div class="main-list">
                                    <div class="column-wrap" v-show="typeId != 'indexPage'">
                                    <h1 v-if="$route.params.tagName">{{'标签：' + $route.params.tagName}}</h1>
                                    <h1 v-else>{{typeId == 'search' ? '搜索：' + $route.params.searchkey : currentCate.name}}</h1>
                                    </div>
                                    <div>
                                        <div class="cate-pannle-menu" v-show="typeId == 'indexPage'">
                                            <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" @select="handleSelect">
                                            <el-menu-item index="1">最新文档</el-menu-item>
                                            </el-menu>
                                        </div>
                                        <div class="article-list">
                                            <ItemList v-for="item in topics.data" :item="item" :key="item._id" />
                                        </div>
                                    </div>
                                    <div class="content-pagination">
                                        <Pagination :pageInfo="topics.pageInfo" :typeId="typeId" />
                                    </div>
                                </div>
                            </el-col>
                            <el-col :xs="24" :sm="17" :md="17" :lg="17" v-else>
                                <div style="height:300px;" v-loading="loadingState">&nbsp;</div>
                            </el-col>
                            <el-col :xs="0" :sm="7" :md="7" :lg="7" >
                                <div class="main-right">
                                    <AdsPannel id="SJllJUAdcZ" />
                                    <div v-if="checkCateList">
                                        <CatesMenu :typeId="$route.params.typeId" />
                                    </div>
                                    <HotContents :hotItems="hotlist" :typeId="$route.params.typeId" v-if="hotlist.length > 0" />
                                    <RecommendContents :reclist="reclist" :typeId="$route.params.typeId" v-if="reclist.length > 0" />
                                    <MessagePannel v-if="typeId == 'indexPage'" :messagelist="messagelist"/>    
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

    </div>
</template>
<script lang="babel">
    import shortid from 'shortid'
    import {
        mapGetters
    } from 'vuex'
    import metaMixin from '~mixins'
    import RecommendContents from '../components/RecommendContents.vue'
    import HotContents from '../components/HotContents.vue'
    import MessagePannel from '../components/MessagePannel.vue'
    import ItemList from '../views/ItemList.vue'
    import Pagination from '../components/Pagination.vue'
    import CatesMenu from '../components/CatesMenu.vue'
    import TopRecoContents from '../components/TopRecoContents.vue'
    import AdsPannel from '../components/AdsPannel.vue'
    import BackTop from '../components/BackTop.vue'

    export default {
        name: 'frontend-index',
        async asyncData({ store, route }, config = { current: 1, model: 'normal'}) {
            const { params: { id,  key, tagName, current, typeId, searchkey },path} = route
            const base = { ...config,  pageSize: 10, id,  path, searchkey, tagName, current, typeId}
            store.dispatch('frontend/article/getRecContentList', { pageSize: 10,typeId })
            store.dispatch('frontend/article/getArticleList', base)
            store.dispatch('global/message/getUserMessageTopList', {pageSize : 5})
            await store.dispatch('frontend/article/getHotContentList', base)
        },
        data(){
            return{
                loadingState: false,
                activeIndex: '1',
            }
        },
        mixins: [metaMixin],
        components: {
            ItemList,
            Pagination,
            RecommendContents,
            HotContents,
            MessagePannel,
            CatesMenu,
            AdsPannel,
            TopRecoContents,
            BackTop
        },
        computed: {
            ...mapGetters({
                reclist: 'frontend/article/getRecContentList',
                hotlist: 'frontend/article/getHotContentList',
                messagelist: 'global/message/getUserMessageTopList',
                systemConfig: 'global/footerConfigs/getSystemConfig'
            }),
            topics(){
                let list  = this.$store.getters['frontend/article/getArticleList'](this.$route.path);
                this.loadingState = list.loading;
                return list;
            },
            typeId() {
                return this.$route.params.typeId ? this.$route.params.typeId : this.$route.meta.typeId;
            },
            checkCateList() {
                let typeId = this.$route.params.typeId
                return typeId != 'indexPage' && shortid.isValid(typeId);
            },
            currentCate() {
                let navs = this.$store.getters['global/category/getHeaderNavList'].data || [];
                const obj = navs.find(item => item._id === this.$route.params.typeId);
                return obj || {};
            }
        },
        methods: {
            handleSelect(key, keyPath) {
                console.log(key, keyPath);
            }
        },
        activated() {
            this.$options.asyncData({ store: this.$store, route: this.$route}, { current: 1})
        },
        metaInfo() {
            const systemData = this.systemConfig.data[0];
            const { siteName, siteDiscription, siteKeywords } = systemData;
            let title = '首页';
            const { tagName, typeId, searchkey } = this.$route.params
            if (typeId) {
                const obj = this.currentCate;
                if (obj) {
                    title = obj.name;
                }
            } else if (searchkey) {
                title = '搜索: ' + searchkey;
            } else if (tagName) {
                title = '标签: ' + tagName;
            }

            return {
                title: title + ' | ' + siteName,
                meta: [{
                        vmid: 'description',
                        name: 'description',
                        content: this.currentCate.comments || siteDiscription
                    },
                    {
                        vmid: 'keywords',
                        name: 'keywords',
                        content: this.currentCate.keywords || siteKeywords
                    }
                ]
            }
        }
    }
</script>

<style lang="scss">
// .column-wrap {
//   position: relative;
//   height: 30px;
//   line-height: 30px;
//   font-size: 20px;
//   color: #303030;
//   padding-left: 18px;
//   margin-bottom: 15px;
// }

// .column-wrap:before {
//   content: "";
//   position: absolute;
//   width: 4px;
//   height: 21px;
//   background: #f63756;
//   left: 0;
//   top: 4px;
// }
</style>