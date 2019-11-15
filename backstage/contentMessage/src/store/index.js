import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import contentMessage from './modules/contentMessage'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    contentMessage
  },
  getters
})

export default store