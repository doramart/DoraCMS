import api from '~api'

const state = () => ({
    lists: [],
    sitemap: []
})

const actions = {
    async ['getSystemConfig']({ commit, state }, config) {
        if (state.lists.data && state.lists.data.docs.length > 0) return;
        const { data } = await api.get('systemConfig/getConfig', { cache: true })
        if (data.docs && data.state === 'success') {
            commit('receiveSystemConfig', {
                ...config,
                ...data
            })
        }
    },
    async ['getSiteMapList']({ commit, state }, config) {
        // if (state.lists.data && state.lists.data.docs.length > 0) return;
        const { data } = await api.get('sitemap/getList', { cache: true })
        // console.log('----data----', data);
        if (data.docs && data.state === 'success') {
            commit('receiveSiteMapList', {
                ...config,
                ...data
            })
        }
    }
}

const mutations = {
    ['receiveSystemConfig'](state, { docs, hasNext, hasPrev, page, path }) {
        state.lists = {
            data: docs, hasNext, hasPrev, page, path
        }
    },
    ['receiveSiteMapList'](state, { docs, hasNext, hasPrev, page, path }) {
        state.sitemap = {
            data: docs, hasNext, hasPrev, page, path
        }
    }
}

const getters = {
    ['getSystemConfig'](state) {
        return state.lists
    },
    ['getSiteMapList'](state) {
        return state.sitemap
    }
}

export default {
    namespaced: true,
    state,
    actions,
    mutations,
    getters
}
