<template>
    <div class="block dr-pagination">
        <div v-if="pageInfo">
            <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page.sync="pageInfo.current" :page-size="pageInfo.pageSize" layout="total, prev, pager, next" :total="pageInfo.totalItems">
            </el-pagination>
        </div>
    </div>
</template>
<style lang="">
.dr-pagination {
    text-align: center;
    margin: 15px auto;
}
</style>
<script>
export default {
    props: {
        pageInfo: Object,
        pageType: String
    },
    methods: {
        handleSizeChange(val) {

            console.log(`每页 ${val} 条`);
            this.$store.dispatch('getAdminUserList', {
                pageSize: val
            });
        },
        handleCurrentChange(val) {
            console.log(`当前页: ${val}`);
            let searchkey = this.pageInfo.searchkey || '';
            if (this.pageType === 'content') {
                this.$store.dispatch('getContentList', {
                    current: val,
                    searchkey
                });
            } else if (this.pageType === 'adminUser') {
                this.$store.dispatch('getAdminUserList', {
                    current: val,
                    searchkey
                });
            } else if (this.pageType === 'adminGroup') {
                this.$store.dispatch('getAdminGroupList', {
                    current: val,
                    searchkey
                });
            } else if (this.pageType === 'contentMessage') {
                this.$store.dispatch('getContentMessageList', {
                    current: val,
                    searchkey
                });
            } else if (this.pageType === 'contentTag') {
                this.$store.dispatch('getContentTagList', {
                    current: val,
                    searchkey
                });
            } else if (this.pageType === 'regUser') {
                this.$store.dispatch('getRegUserList', {
                    current: val,
                    searchkey
                });
            } else if (this.pageType === 'backUpData') {
                this.$store.dispatch('getBakDateList', {
                    current: val,
                    searchkey
                });
            } else if (this.pageType === 'systemOptionLogs') {
                this.$store.dispatch('getSystemLogsList', {
                    current: val,
                    searchkey
                });
            } else if (this.pageType === 'systemNotify') {
                this.$store.dispatch('getSystemNotifyList', {
                    current: val,
                    searchkey
                });
            } else if (this.pageType === 'systemAnnounce') {
                this.$store.dispatch('getSystemAnnounceList', {
                    current: val,
                    searchkey
                });
            } else if (this.pageType === 'ads') {
                this.$store.dispatch('getAdsList', {
                    current: val,
                    searchkey
                });
            }

        }
    },
    data() {

        return {

        };
    }
}
</script>