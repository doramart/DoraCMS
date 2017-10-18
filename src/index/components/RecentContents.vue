<template>
    <PannelBox title="近期文章" className="recent-content-list">
        <div class="content-list">
            <ul>
                <li :key='index' v-for="(item,index) in recentItems">
                    <span class="triangle"></span>
                    <div class="con">
                        <router-link class="title" :to="'/details/'+item._id+'.html'">{{item.title}}</router-link>
                        <span class="time">{{item.updateDate}}</span>
                    </div>
                </li>
            </ul>
        </div>
    </PannelBox>
</template>
<script>
    import PannelBox from './PannelBox.vue'
    export default {
        name: 'recentlyContents',
        data() {
            return {
                loadingState: true
            }
        },
        components: {
            PannelBox
        },
        props: ['recentItems']
    }
</script>

<style lang="scss">
    .recent-content-list {
        .content-list {
            text-align: left;
            ul {
                li {
                    font-size: 14px;
                    padding: 0 0 .75rem 1rem;
                    position: relative;
                    color: #333;
                    .triangle {
                        position: absolute;
                        top: .3rem;
                        left: .3rem;
                        width: 0;
                        height: 0;
                        border-style: solid;
                        border-color: #fff #fff #fff #4285f4;
                        -webkit-transform-origin: 25% center;
                        transform-origin: 25% center;
                        border-width: 4px;
                    }
                    .con {
                        -webkit-transition: opacity .5s ease-in;
                        transition: opacity .5s ease-in;
                        .title{
                            display: block;
                        }
                        .time {
                            padding-top: 3px;
                            display: inline-block;
                            color: #a4abb1;
                        }
                    }
                }
            }
        }
    }
</style>