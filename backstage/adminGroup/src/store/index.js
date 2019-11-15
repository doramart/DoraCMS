import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import adminGroup from './modules/adminGroup'
import adminResource from './modules/adminResource'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    adminGroup,
    adminResource
  },
  getters
})

export default store