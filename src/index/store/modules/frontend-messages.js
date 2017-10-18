import api from '~api'

const state = () => ({
    lists: {
        data: [],
        hasNext: 0,
        page: 1,
        path: ''
    },
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
        // console.log('---msgdata----', data);
        if (data.docs && data.state === 'success') {
            commit('recevieMessageList', {
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
    ['recevieMessageForm'](state, formState) {
        state.form.reply = formState.reply;
        state.form.formData = Object.assign(state.form.formData, formState.formData);
    },
    ['insertCommentItem'](state, data) {
        state.lists.data = [data].concat(state.lists.data)
    },
    ['deleteComment'](state, id) {
        const obj = state.lists.data.find(ii => ii._id === id)
        obj.is_delete = 1
    },
    ['recoverComment'](state, id) {
        const obj = state.lists.data.find(ii => ii._id === id)
        obj.is_delete = 0
    }
}

const getters = {
    ['getUserMessageList'](state) {
        return state.lists
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
