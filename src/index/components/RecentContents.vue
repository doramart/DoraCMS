<template>
    <div class="recent-content-list">
        <h3 class="content-title pannel-title">
            <span>近期文章</span>
        </h3>
        <div class="content-list">
            <ul>
                <li :key='index' v-for="(item,index) in recentItems">
                    <router-link :to="'/details/'+item._id+'.html'">{{item.stitle}}</router-link>
                </li>
            </ul>
        </div>
    </div>
</template>
<script>
export default {
    name: 'recentlyContents',
    data() {
        return {
            loadingState: true
        }
    },
    props: ['recentItems']
}

</script>

<style lang="scss">
.recent-content-list {
    margin-bottom: 30px;
    .content-list {
        text-align: left;
        ul {
            li {
                font-size: 14px;
                position: relative;
                border-bottom: 1px dashed #ededed;
                a {
                    display: block;
                    width: 100%;
                    line-height: 30px;
                    padding: 8px 0px;
                }
            }
        }
    }
}
</style>
