import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import regUser from './modules/regUser'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    regUser
  },
  getters
})

export default store