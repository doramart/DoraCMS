<template>
    <div class="adminUser">
        <SiteMessageForm :dialogState="formState"></SiteMessageForm>
        <el-row class="dr-datatable">
            <el-col :span="24">
                <TopBar type="siteMessage" :pageInfo="siteMessageList.pageInfo"></TopBar>
                <DataTable :pageInfo="siteMessageList.pageInfo" :dataList="siteMessageList.docs"></DataTable>
                <Pagination :pageInfo="siteMessageList.pageInfo" pageType="siteMessage"></Pagination>
            </el-col>
        </el-row>
    </div>
</template>
<script>
    import SiteMessageForm from './siteMessageForm'
    import DataTable from './dataTable.vue';
    import TopBar from '../common/TopBar.vue';
    import Pagination from '../common/Pagination.vue';
    import {
        mapGetters,
        mapActions
    } from 'vuex'

    export default {
        name: 'index',
        data() {
            return {

            }
        },
        components: {
            DataTable,
            TopBar,
            SiteMessageForm,
            Pagination
        },
        methods: mapActions([

        ]),
        computed: {
            ...mapGetters([
                'siteMessageList'
            ]),
            formState() {
                return this.$store.getters.siteMessageFormState
            }
        },
        mounted() {
            this.$store.dispatch('getSiteMessageList');
        }
    }
</script>

<style lang="">

</style>