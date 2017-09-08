<template>
    <div class="adminUser">
        <el-row class="dr-datatable">
            <el-col :span="24">
                <TopBar type="backUpData"></TopBar>
                <DataTable :dataList="bakDataList.docs"></DataTable>
                <Pagination :pageInfo="bakDataList.pageInfo" pageType="backUpData"></Pagination>
            </el-col>
        </el-row>
    </div>
</template>
<script>
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
            Pagination
        },
        methods: mapActions([

        ]),
        computed: {
            ...mapGetters([
                'bakDataList'
            ])
        },
        mounted() {
            this.$store.dispatch('getBakDateList');
        }
    }

</script>

<style lang="">


</style>
