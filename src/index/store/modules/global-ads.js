import api from '~api'

const state = () => ({
    lists: []
})

const actions = {
    async ['getAdsList']({ commit, state }, config) {
        const { data } = await api.get('ads/getAll', { ...config })
        if (data.docs && data.state === 'success') {
            commit('receiveAdsList', {
                ...config,
                ...data
            })
        }
    }
}

const mutations = {
    ['receiveAdsList'](state, { docs,  path }) {
        state.lists = {
            data: docs, path
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
