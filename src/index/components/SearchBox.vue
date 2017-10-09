<template>
    <PannelBox title="搜索" className="search-box">
        <div class="input-area">
            <el-form>
                <el-form-item>
                    <el-input size="small" placeholder="请输入关键字" v-model="searchkey">
                        <i slot="suffix" class="el-input__icon el-icon-search" @click="handleIconClick"></i>
                    </el-input>
                </el-form-item>
            </el-form>
        </div>
    </PannelBox>
</template>
<script>
    import {
        mapGetters,
        mapActions
    } from 'vuex'
    import PannelBox from './PannelBox.vue'
    export default {
        name: 'searchbox',
        data() {
            return {
                searchkey: ''
            }
        },
        components: {
            PannelBox
        },
        methods: {
            handleIconClick(ev) {
                this.$router.replace('/search/' + this.searchkey)
            },
            search(e) {
                // var qs = e.target.value
                // if (qs === "") {
                //     return false
                // }
                // this.$router.replace('/search/' + qs)
            }
        }
    }
</script>
<style lang="scss">
    .search-box {
        .input-area {
            padding: 15px 30px 0px;
        }
    }
</style>