<template>
    <div>
        <div class="contentContainer">
            <div>
                <el-row :gutter="0">
                    <el-col :xs="1" :sm="1" :md="1" :lg="1">
                        <div class="grid-content bg-purple">&nbsp;</div>
                    </el-col>
                    <el-col :xs="22" :sm="22" :md="22" :lg="22" class="content-mainbody-left">
                        <el-row :gutter="24">
                            <el-col :xs="24" :sm="18" :md="18" :lg="18" v-if="topics.data.length > 0">
                                <ItemList v-for="item in topics.data" :item="item" :key="item._id" />
                                <div class="content-pagination">
                                    <Pagination :pageInfo="topics.pageInfo" :typeId="typeId" />
                                </div>
                            </el-col>
                            <el-col :xs="24" :sm="18" :md="18" :lg="18" v-else>
                                <div>暂无内容...</div>
                            </el-col>
                            <el-col :xs="0" :sm="6" :md="6" :lg="6" class="content-mainbody-right">
                                <div class="grid-content bg-purple-light title">
                                    <SearchBox />
                                    <div v-if="checkCateList">
                                        <CatesMenu :typeId="$route.params.typeId" />
                                    </div>
                                    <Tag :tags="tags.data" />
                                    <HotContents :hotItems="hotlist" :typeId="$route.params.typeId" v-if="hotlist.length > 0" />
                                </div>
                            </el-col>
                        </el-row>
                    </el-col>
                    <el-col :xs="1" :sm="1" :md="1" :lg="1">
                        <div class="grid-content bg-purple">&nbsp;</div>
                    </el-col>
                </el-row>
            </div>
        </div>
    
    </div>
</template>
<script lang="babel">
import shortid from 'shortid'
import { mapGetters } from 'vuex'
import metaMixin from '~mixins'
import HotContents from '../components/HotContents.vue'
import SearchBox from '../components/SearchBox.vue'
import ItemList from '../views/ItemList.vue'
import Pagination from '../components/Pagination.vue'
import Tag from '../components/Tag.vue'
import CatesMenu from '../components/CatesMenu.vue'

export default {
    name: 'frontend-index',
    async asyncData({store, route}, config = { current: 1,model:'normal'}) {
        const {params: {id, key, tagName, current, typeId, searchkey}, path} = route
        const base = { ...config, pageSize: 10, id, path, searchkey, tagName, current, typeId }
        store.dispatch('frontend/article/getHotContentList', { pageSize: 10 , typeId})
        store.dispatch('global/tags/getTagList', { pageSize: 30 })
        await store.dispatch('frontend/article/getArticleList', base)
    },
    mixins: [metaMixin],
    components: {
        ItemList,
        Pagination,
        HotContents,
        SearchBox,
        Tag,
        CatesMenu
    },
    computed: {
        ...mapGetters({
            topics: 'frontend/article/getArticleList',
            hotlist: 'frontend/article/getHotContentList',
            tags: 'global/tags/getTagList',
            systemConfig: 'global/footerConfigs/getSystemConfig'
        }),
        typeId(){
            return this.$route.params.typeId ? this.$route.params.typeId : this.$route.meta.typeId;
        },
        checkCateList() {
            let typeId = this.$route.params.typeId
            return typeId != 'indexPage' && shortid.isValid(typeId);
        },
        currentCate(){
            let navs = this.$store.getters['global/category/getHeaderNavList'].data || [];
            const obj = navs.find(item => item._id === this.$route.params.typeId);
            return obj || {};
        }
    },
    methods: {
        
    },
    activated() {
        this.$options.asyncData({store: this.$store, route: this.$route}, {current: 1})
    },
    metaInfo() {
        const systemData = this.systemConfig.data[0];
        const { siteName, siteDiscription, siteKeywords} = systemData;
        let title = '首页';
        const {tagName, typeId, searchkey} = this.$route.params
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
            meta: [
                { vmid: 'description', name: 'description', content: this.currentCate.comments || siteDiscription},
                { vmid: 'keywords', name: 'keywords', content: this.currentCate.keywords || siteKeywords }
            ]
        }
    }
}
</script>

<style>
body {
    padding: 0;
}
</style>
