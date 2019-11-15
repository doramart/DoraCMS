import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import plugin from './modules/plugin'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    plugin
  },
  getters
})

export default store