import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import templateConfig from './modules/templateConfig'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    templateConfig
  },
  getters
})

export default store