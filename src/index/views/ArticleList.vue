<template>
    <div>
        <div class="contentContainer">
            <div>
                <el-row :gutter="0">
                    <el-col :xs="1" :sm="1" :md="3" :lg="3" :xl="6">
                        <div class="grid-content bg-purple">&nbsp;</div>
                    </el-col>
                    <el-col :xs="22" :sm="22" :md="18" :lg="18" :xl="12" class="content-mainbody-left">
                        <el-row :gutter="24">
                            <el-col :xs="24" :sm="17" :md="17" :lg="17" v-if="topics.data.length > 0">
                                <div class="column-wrap" v-show="typeId != 'indexPage'">
                                    <span v-if="$route.params.tagName">{{'标签：' + $route.params.tagName}}</span>
                                    <span v-else>{{typeId == 'search' ? '搜索：' + $route.params.searchkey : currentCate.name}}</span>
                                </div>
                                <div>
                                    <ItemList v-for="item in topics.data" :item="item" :key="item._id" />
                                </div>
                                <div class="content-pagination">
                                    <Pagination :pageInfo="topics.pageInfo" :typeId="typeId" />
                                </div>
                            </el-col>
                            <el-col :xs="24" :sm="17" :md="17" :lg="17" v-else>
                                <div style="height:300px;" v-loading="loadingState">&nbsp;</div>
                            </el-col>
                            <el-col :xs="0" :sm="7" :md="7" :lg="7" class="content-mainbody-right">
                                <div class="grid-content bg-purple-light title">
                                    <AdsPannel id="SJllJUAdcZ" />
                                    <div v-if="checkCateList">
                                        <CatesMenu :typeId="$route.params.typeId" />
                                    </div>
                                    <Tag :tags="tags.data" />
                                    <HotContents :hotItems="hotlist" :typeId="$route.params.typeId" v-if="hotlist.length > 0" />
                                </div>
                            </el-col>
                        </el-row>
                    </el-col>
                    <el-col :xs="1" :sm="1" :md="3" :lg="3" :xl="6">
                        <div class="grid-content bg-purple">&nbsp;</div>
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
    import HotContents from '../components/HotContents.vue'
    import SearchBox from '../components/SearchBox.vue'
    import ItemList from '../views/ItemList.vue'
    import Pagination from '../components/Pagination.vue'
    import Tag from '../components/Tag.vue'
    import CatesMenu from '../components/CatesMenu.vue'
    import AdsPannel from '../components/AdsPannel.vue'

    export default {
        name: 'frontend-index',
        async asyncData({
            store,
            route
        }, config = {
            current: 1,
            model: 'normal'
        }) {
            const {
                params: {
                    id,
                    key,
                    tagName,
                    current,
                    typeId,
                    searchkey
                },
                path
            } = route
            const base = { ...config,
                pageSize: 10,
                id,
                path,
                searchkey,
                tagName,
                current,
                typeId
            }
            store.dispatch('frontend/article/getHotContentList', {
                pageSize: 10,
                typeId
            })
            store.dispatch('global/tags/getTagList', {
                pageSize: 30
            })
            await store.dispatch('frontend/article/getArticleList', base)
        },
        data(){
            return{
                loadingState: false
            }
        },
        mixins: [metaMixin],
        components: {
            ItemList,
            Pagination,
            HotContents,
            SearchBox,
            Tag,
            CatesMenu,
            AdsPannel
        },
        computed: {
            ...mapGetters({
                hotlist: 'frontend/article/getHotContentList',
                tags: 'global/tags/getTagList',
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

        },
        activated() {
            this.$options.asyncData({
                store: this.$store,
                route: this.$route
            }, {
                current: 1
            })
        },
        metaInfo() {
            const systemData = this.systemConfig.data[0];
            const {
                siteName,
                siteDiscription,
                siteKeywords
            } = systemData;
            let title = '首页';
            const {
                tagName,
                typeId,
                searchkey
            } = this.$route.params
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
.column-wrap {
  position: relative;
  height: 30px;
  line-height: 30px;
  font-size: 20px;
  color: #303030;
  padding-left: 18px;
  margin-bottom: 15px;
}

.column-wrap:before {
  content: "";
  position: absolute;
  width: 4px;
  height: 21px;
  background: #f63756;
  left: 0;
  top: 4px;
}
</style>