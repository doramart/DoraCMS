import api from '~api'

const state = () => ({
    loginForm: {
        userName: '',
        password: '',
        imageCode: ''
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
            password: '',
            imageCode: ''
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
