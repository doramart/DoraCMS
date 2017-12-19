<template>
    <div class="content-pagination" v-if="pageInfo && pageInfo.totalItems > 0">
        <el-pagination small layout="prev, pager, next" :total="pageInfo.totalItems" :current-page="pageInfo.current" @current-change="handleCurrentChange">
        </el-pagination>
    </div>
</template>
<script>
export default {
    props: {
        pageInfo: Object,
        typeId: String
    },
    methods: {
        handleCurrentChange(val) {
            console.log(`当前页: ${val}`);
            if (this.typeId === 'indexPage') { // 首页
                this.$router.push('/page/' + val);
            } else if (this.typeId === 'search') { // 搜索结果
                let searchKey = this.$route.params.searchkey;
                this.$router.push('/search/' + searchKey + '/' + val);
            } else if (this.typeId === 'tags') { // 搜索结果
                let tagName = this.$route.params.tagName;
                this.$router.push('/tag/' + tagName + '/' + val);
            } else if (this.typeId === 'userNotices') {
                this.$store.dispatch('frontend/user/userNotices', { current: val });
            } else if (this.typeId === 'userReplies') {
                this.$store.dispatch('frontend/user/userReplies', { current: val });
            } else { // 分类页
                let pathArr = (this.$route.path.split('___'));
                let endPath = pathArr[0] + '___' + pathArr[1].split('/')[0]
                this.$router.push(endPath + '/' + val);
            }
        }
    }
}

</script>

<style lang="scss">

</style>
