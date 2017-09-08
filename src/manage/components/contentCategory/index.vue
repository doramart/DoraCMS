<template>
    <div class="admincategory">
        <CategoryForm :dialogState="formState"></CategoryForm>
        <el-row class="dr-datatable">
            <el-col :span="24">
                <TopBar type="contentCategory"></TopBar>
                <CategoryTree :treeData="contentCategoryList.docs"></CategoryTree>
            </el-col>
        </el-row>
    </div>
</template>
<script>
    import CategoryForm from './categoryForm'
    import CategoryTree from './categoryTree'
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
            CategoryForm,
            CategoryTree
        },
        methods: mapActions([

        ]),
        computed: {
            ...mapGetters([
                'contentCategoryList'
            ]),
            formState() {
                return this.$store.getters.contentCategoryFormState
            }
        },
        mounted() {
            this.$store.dispatch('getContentCategoryList')
        }
    }
</script>

<style lang="">

</style>