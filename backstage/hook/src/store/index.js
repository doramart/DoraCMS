import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import hooks from './modules/hooks'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    hooks
  },
  getters
})

export default store