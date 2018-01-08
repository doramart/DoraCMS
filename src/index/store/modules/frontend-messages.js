import api from '~api'

const state = () => ({
    lists: {
        data: [],
        hasNext: 0,
        page: 1,
        path: ''
    },
    toplist: [],
    form: {
        reply: false,
        formData: {
            contentId: '',
            content: '',
            replyContent: '',
            replyAuthor: '',
            relationMsgId: ''
        }
    }
})

const actions = {
    async ['getUserMessageList']({ commit, state }, config) {
        const { data } = await api.get('message/getList', { ...config })
        if (data.docs && data.state === 'success') {
            commit('recevieMessageList', {
                ...config,
                ...data
            })
        }
    },
    async ['getUserMessageTopList']({ commit, state }, config) {
        const { data } = await api.get('message/getList', { ...config })
        if (data.docs && data.state === 'success') {
            commit('recevieMessageTopList', {
                ...config,
                ...data
            })
        }
    },
    async ['messageform']({ commit, state }, params = {
        reply: false,
        formData: {}
    }) {
        commit('recevieMessageForm', {
            reply: params.reply,
            formData: params.formData
        })
    }
}

const mutations = {
    ['recevieMessageList'](state, { docs, hasNext, hasPrev, page, path }) {
        state.lists = {
            data: docs, hasNext, hasPrev, page, path
        }
    },
    ['recevieMessageTopList'](state, { docs }) {
        state.toplist = {
            data: docs
        }
    },
    ['recevieMessageForm'](state, formState) {
        state.form.reply = formState.reply;
        state.form.formData = Object.assign(state.form.formData, formState.formData);
    }
}

const getters = {
    ['getUserMessageList'](state) {
        return state.lists
    },
    ['getUserMessageTopList'](state) {
        return state.toplist
    },
    ['getMessageForm'](state) {
        return state.form
    }
}

export default {
    namespaced: true,
    state,
    actions,
    mutations,
    getters
}
