import api from '~api'

const state = () => ({
    lists: []
})

const actions = {
    async ['getTagList']({ commit, state }, config) {
        // if (state.list.data.length > 0 && config.path === state.lists.path && config.page === 1) {
        //     return
        // }
        const { data } = await api.get('contentTag/getList', { ...config, cache: true })
        // console.log('----data--', data);
        if (data.docs && data.state === 'success') {
            commit('receiveTagList', {
                ...config,
                ...data
            })
        }
    }
}

const mutations = {
    ['receiveTagList'](state, { docs, hasNext, hasPrev, page, path }) {
        state.lists = {
            data: docs, hasNext, hasPrev, page, path
        }
    }
}

const getters = {
    ['getTagList'](state) {
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
