import api from '~api'

const state = () => ({
    lists: {
        data: [],
        hasNext: 0,
        page: 1,
        path: ''
    },
    item: {
        data: {},
        path: '',
        isLoad: false
    },
    hotContentList: [],
    recContentList: [],
    recentContentList: []
})

const actions = {
    async ['getArticleList']({
        commit,
        state
    }, config) {
        if (state.lists.data.length > 0 && config.path === state.lists.path) {
            return
        }
        const {
            data
        } = await api.get('content/getList', {
                ...config,
                cache: true
            })
        if (data.docs && data.state === 'success') {
            commit('receiveArticleList', {
                ...config,
                ...data
            })
        }
    },
    async ['getArticleItem']({
        commit,
        state
    }, config) {
        const {
            data: {
                doc, messages, randomArticles
            }
        } = await api.get('content/getContent', {
                ...config
            })
        if (doc) {
            commit('receiveArticleItem', {
                doc,
                messages, randomArticles,
                ...config
            })
        }
    },
    async ['getHotContentList']({
        commit,
        state
    }, config) {
        if (state.hotContentList.length && config.path === state.lists.path) return
        const {
            data
        } = await api.get('content/getSimpleListByParams', {
                ...config,
                sortby: 'clickNum',
                model: 'simple',
                cache: true
            })
        if (data.docs && data.state === 'success') {
            commit('receiveHotList', data)
        }
    },
    async ['getRecContentList']({
        commit,
        state
    }, config) {
        if (state.recContentList.length && config.path === state.lists.path) return
        const {
            data
        } = await api.get('content/getSimpleListByParams', {
                ...config,
                isTop: 1,
                model: 'simple',
                cache: true
            })
        if (data.docs && data.state === 'success') {
            commit('receiveRecList', data)
        }
    },
    async ['getRecentContentList']({
        commit,
        state
    }, config) {
        const {
            data
        } = await api.get('content/getSimpleListByParams', {
                ...config,
                model: 'simple',
                cache: true
            })
        if (data.docs && data.state === 'success') {
            commit('receiveRecentList', data)
        }
    }
}

const mutations = {
    ['receiveArticleList'](state, {
        docs,
        pageInfo,
        hasNext,
        hasPrev,
        page,
        path
    }) {
        state.lists = {
            data: docs,
            pageInfo,
            hasNext,
            hasPrev,
            page,
            path
        }
    },
    ['receiveArticleItem'](state, {
        doc, messages, randomArticles,
        path
    }) {
        state.item = {
            doc, messages, randomArticles,
            path,
            isLoad: true
        }
    },
    ['receiveHotList'](state, data) {
        state.hotContentList = data.docs
    },
    ['receiveRecList'](state, data) {
        state.recContentList = data.docs
    },
    ['receiveRecentList'](state, data) {
        state.recentContentList = data.docs
    }
}

const getters = {
    getArticleList: (state, getters) => (path) => {
        if (path === state.lists.path) {
            return state.lists
        } else return {
            data: {},
            loading: true
        }
    },
    ['getArticleItem'](state) {
        return state.item
    },
    ['getHotContentList'](state) {
        return state.hotContentList
    },
    ['getRecContentList'](state) {
        return state.recContentList
    },
    ['getRecentContentList'](state) {
        return state.recentContentList
    }
}

export default {
    namespaced: true,
    state,
    actions,
    mutations,
    getters
}
