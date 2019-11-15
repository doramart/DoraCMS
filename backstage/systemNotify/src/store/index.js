import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import systemNotify from './modules/systemNotify'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    systemNotify
  },
  getters
})

export default store