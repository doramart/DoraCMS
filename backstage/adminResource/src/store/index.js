import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import adminResource from './modules/adminResource'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    adminResource
  },
  getters
})

export default store