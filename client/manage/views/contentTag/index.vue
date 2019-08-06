<template>
    <div class="adminUser">
        <TagForm :dialogState="formState"></TagForm>
        <el-row class="dr-datatable">
            <el-col :span="24">
                <TopBar type="contentTag" :pageInfo="contentTagList.pageInfo"></TopBar>
                <DataTable :pageInfo="contentTagList.pageInfo" :dataList="contentTagList.docs"></DataTable>
                <Pagination :pageInfo="contentTagList.pageInfo" pageType="contentTag"></Pagination>
            </el-col>
        </el-row>
    </div>
</template>
<script>
    import TagForm from './tagForm'
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
            TagForm,
            Pagination
        },
        methods: mapActions([

        ]),
        computed: {
            ...mapGetters([
                'contentTagList'
            ]),
            formState() {
                return this.$store.getters.contentTagFormState
            }
        },
        mounted() {
            this.$store.dispatch('getContentTagList');
        }
    }
</script>

<style lang="">

</style>