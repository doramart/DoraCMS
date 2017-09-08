<style lang='scss'>
article:last-child {
    border: none
}
</style>
<template>
    <div class="post">
        <TopItem :item="item" :key="item._id" />
    </div>
</template>

<script>
import TopItem from './TopItem'
import {
    mapGetters,
    mapActions
} from 'vuex'
export default {
    name: 'itemlist',
    props: ['item'],
    data() {
        return {
            // displayedItems: this.$store.getters.contentList
        }
    },
    components: {
        // Pagination,
        TopItem
    },
    methods: {

    },
    computed: {

    }

}

</script>
