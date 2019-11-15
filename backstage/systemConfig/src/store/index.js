import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import systemConfig from './modules/systemConfig'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    systemConfig
  },
  getters
})

export default store