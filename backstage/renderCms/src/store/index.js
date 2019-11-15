import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import renderCms from './modules/renderCms'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    renderCms
  },
  getters
})

export default store