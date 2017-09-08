<template>
    <div class="adminResource">
        <ResourceForm :dialogState="formState"></ResourceForm>
        <el-row class="dr-datatable">
            <el-col :span="24">
                <TopBar type="adminResource"></TopBar>
                <ResourceTree :treeData="adminResourceList.docs" pageType="adminResource"></ResourceTree>
            </el-col>
        </el-row>
    </div>
</template>
<script>
    import ResourceForm from './resourceForm'
    import ResourceTree from './resourceTree'
    import TopBar from '../common/TopBar.vue';
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
            TopBar,
            ResourceForm,
            ResourceTree
        },
        methods: mapActions([

        ]),
        computed: {
            ...mapGetters([
                'adminResourceList'
            ]),
            formState() {
                return this.$store.getters.adminResourceFormState
            }
        },
        mounted() {
            this.$store.dispatch('getAdminResourceList')
        }
    }
</script>

<style lang="">

</style>