import api from '~api'

const state = () => ({
    lists: []
})

const actions = {
    async ['getAdsList']({ commit, state }, config) {
        const { data } = await api.get('ads/getOne', { ...config })
        if (data.doc && data.state === 'success') {
            commit('receiveAdsList', {
                ...config,
                ...data
            })
        }
    }
}

const mutations = {
    ['receiveAdsList'](state, { doc, hasNext, hasPrev, page, path }) {
        state.lists = {
            data: doc, hasNext, hasPrev, page, path
        }
    }
}

const getters = {
    ['getAdsList'](state) {
        return state.lists
    }
}

export default {
    namespaced: true,
    state,
    actions,
    mutations,
    getters
}
