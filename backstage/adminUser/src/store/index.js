import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import adminUser from './modules/adminUser'
import adminGroup from './modules/adminGroup'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    adminUser,
    adminGroup
  },
  getters
})

export default store