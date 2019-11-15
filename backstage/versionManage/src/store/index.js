import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import versionManage from './modules/versionManage'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    versionManage
  },
  getters
})

export default store