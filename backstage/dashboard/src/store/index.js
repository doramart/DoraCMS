import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import dashboard from './modules/dashboard'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    dashboard
  },
  getters
})

export default store