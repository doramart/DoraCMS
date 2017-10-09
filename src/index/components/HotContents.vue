<template>
    <div>
        <PannelBox title="热门文章" className="hot-content-list">
            <div class="content-list">
                <ul>
                    <li class="hot-li" v-for="(item,index) in hotItems" :key="item._id">
                        <router-link :to="'/details/'+item._id+'.html'" class="continue-reading">
                            <img :src="item.sImg" :alt="item.title" />
                        </router-link>
                        <div class="left-area">
                            <router-link class="title" :to="'/details/'+item._id+'.html'">{{item.title}}</router-link>
                        </div>
                    </li>
                </ul>
            </div>
        </PannelBox>
    </div>
</template>
<script>
    import PannelBox from './PannelBox.vue'
    export default {
        name: 'hotContents',
        data() {
            return {
                loadingState: true
            }
        },
        props: ['hotItems', 'typeId'],
        components: {
            PannelBox
        },
        serverCacheKey: props => {
            return `hotItem-${props.typeId}`
        }
    }
</script>

<style lang="scss">
    .hot-content-list {
        margin-bottom: 30px;
        .content-list {
            text-align: left;
            ul {
                .hot-li:last-child{
                    border: none;
                }
                li {
                    position: relative;
                    padding: 10px 0;
                    overflow: hidden;
                    font-size: 14px;
                    display: block;
                    height: 3.5rem;
                    img {
                        width: 5rem;
                        height: 3.5rem;
                        position: absolute;
                    }
                    .left-area{
                        padding-left: 6rem;
                    }
                    
                }
            }
        }
    }
</style>