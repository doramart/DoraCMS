import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import helpCenter from './modules/helpCenter'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    helpCenter
  },
  getters
})

export default store