import _ from 'lodash'
function getTitle(vm) {
    const { metaInfo } = vm.$options
    if (metaInfo) {
        return typeof metaInfo === 'function' ? metaInfo.call(vm) : metaInfo
    }
}

const serverTitleMixin = {
    created() {
        const meta = getTitle(this)
        if (meta) {
            let mInfo = meta.meta
            let desObj = _.filter(mInfo, (item) => {
                return item.name == 'description'
            }) || [];
            let keyObj = _.filter(mInfo, (item) => {
                return item.name == 'keywords'
            }) || [];
            this.$ssrContext.title = meta.title || meta
            desObj[0] && (this.$ssrContext.description = desObj[0].content || '前端俱乐部')
            keyObj[0] && (this.$ssrContext.keywords = keyObj[0].content || '前端俱乐部')
        }
    }
}

const clientTitleMixin = {
    mounted() {

    }
}

export default process.env.VUE_ENV === 'server' ? serverTitleMixin : clientTitleMixin
