<template>
    <div class="content-ads" v-if="ads.data">
        <div class="img-pannel" v-if="ads.data.type == '1'">
            <div v-if="ads.data.items.length == 1">
                <a :href="ads.data.items[0].link" target="_blank"><img :src="ads.data.items[0].sImg" :alt="ads.data.items[0].alt" /></a>
            </div>
            <div v-else>
                <el-carousel :height="ads.data.height+'px'">
                    <el-carousel-item v-for="item in ads.data.items" :key="item._id">
                        <h3>
                            <a :href="item.link" target="_blank"><img :height="ads.data.height+'px'" :src="item.sImg" :alt="item.alt" /></a>
                        </h3>
                    </el-carousel-item>
                </el-carousel>
            </div>
        </div>
        <div class="text-pannel" v-if="ads.data.type == '0'">
            <ul>
                <li v-for="item in ads.data.items" :key="item._id">
                    <a :href="item.link" target="_blank">{{item.title}}</a>
                </li>
            </ul>
        </div>
    </div>
</template>
<script>
import { mapGetters } from 'vuex'
export default {
    name: 'Ads',
    props: {
        id: String
    },
    mounted() {
        this.$store.dispatch('global/ads/getAdsList', { id: this.id })
    },
    computed: {
        ...mapGetters({
            ads: 'global/ads/getAdsList'
        })
    }
}

</script>

<style lang="scss">
.el-carousel__item h3 {
    color: #475669;
    font-size: 18px;
    opacity: 0.75;
    margin: 0;
}

.el-carousel__item:nth-child(2n) {
    background-color: #99a9bf;
}

.el-carousel__item:nth-child(2n+1) {
    background-color: #d3dce6;
}

.img-pannel {
    img {
        width: 100%;
    }
}

.text-pannel ul li {
    display: inline-block;
    margin-right: 10px;
}
</style>
