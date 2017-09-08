import api from '~api'

const state = () => ({
    loginForm: {
        userName: '',
        password: ''
    }
})

const actions = {
    async ['loginForm']({
        commit
    }, params) {
        commit('recevieAdminLoginForm', {
            ...params
        })
    },
}

const mutations = {
    ['recevieAdminLoginForm'](state, { formData }) {
        state.loginForm = Object.assign({
            email: '',
            password: ''
        }, formData);
    }
}

const getters = {
    ['loginForm'](state) {
        return state.loginForm
    }
}

export default {
    namespaced: true,
    state,
    actions,
    mutations,
    getters
}
