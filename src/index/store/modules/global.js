// import toastr from 'toastr'
import {inBrowser} from '~utils'

// toastr.options.positionClass = 'toast-top-center'

const state = () => ({
    loading: false,
    showLoginModal: false,
    showRegisterModal: false
})

const actions = {
    ['showMsg'](store, config) {
        let content, type
        if (typeof config === 'string') {
            content = config
            type = 'error'
        } else {
            content = config.content
            type = config.type
        }
        // if (inBrowser) toastr[type](content)
    },
    ['hideMsg']() {
        // toastr.clear()
    }
}

const mutations = {
    ['showLoginModal'](state, payload) {
        state.showLoginModal = payload
    },
    ['showRegisterModal'](state, payload) {
        state.showRegisterModal = payload
    }
}

const getters = {
    ['getGlobal'](state) {
        return state
    }
}

export default {
    actions,
    state,
    mutations,
    getters
}
