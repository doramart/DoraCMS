import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import backUpData from './modules/backUpData'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    backUpData
  },
  getters
})

export default store