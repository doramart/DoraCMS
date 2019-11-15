import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import announce from './modules/announce'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    announce
  },
  getters
})

export default store