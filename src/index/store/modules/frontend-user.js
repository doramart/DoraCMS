import api from '~api'

const state = () => ({
    sessionState: {
        userInfo: {},
        logined: false
    },
    loginForm: {
        email: '',
        password: ''
    },
    regForm: {
        userName: '',
        email: '',
        password: '',
        confirmPassword: ''
    },
    userNotices: {
        docs: [],
        pageInfo: {

        }
    },
    userReplies: {
        docs: [],
        pageInfo: {

        }
    }
})

const actions = {
    async ['getSessionState']({ commit, state }, config) {
        const { data } = await api.get('users/session')
        // console.log('---getUserSessionState----', data);
        if (data.state === 'success') {
            commit('recevieSessionState', {
                ...config,
                ...data
            })
        }
    },
    async ['loginForm']({
        commit
    }, params) {
        commit('recevieUserLoginForm', {
            ...params
        })
    },
    async ['regForm']({
        commit
    }, params) {
        commit('recevieUserRegForm', {
            ...params
        })
    },
    async ['userNotices']({
        commit
    }, params) {
        const { data } = await api.get('users/getUserNotifys')
        commit('recevieUserNotices', data)
    },
    async ['userReplies']({
        commit
    }, params) {
        const { data } = await api.get('users/getUserReplies')
        commit('recevieUserReplies', data)
    }
}

const mutations = {
    ['recevieSessionState'](state, { userInfo, logined }) {
        state.sessionState = {
            userInfo, logined
        }
    },
    ['recevieUserLoginForm'](state, { formData }) {
        state.loginForm = Object.assign({
            email: '',
            password: ''
        }, formData);
    },
    ['recevieUserRegForm'](state, { formData }) {
        state.regForm = Object.assign({
            userName: '',
            email: '',
            password: '',
            confirmPassword: ''
        }, formData);
    },
    ['recevieUserNotices'](state, noticelist) {
        state.userNotices = noticelist
    },
    ['recevieUserReplies'](state, replylist) {
        state.userReplies = replylist
    }
}

const getters = {
    ['getSessionState'](state) {
        return state.sessionState
    },
    ['loginForm'](state) {
        return state.loginForm
    },
    ['regForm'](state) {
        return state.regForm
    },
    ['noticelist'](state) {
        return state.userNotices
    },
    ['replylist'](state) {
        return state.userReplies
    }
}

export default {
    namespaced: true,
    state,
    actions,
    mutations,
    getters
}
