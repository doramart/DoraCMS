import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import contentTag from './modules/contentTag'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    contentTag
  },
  getters
})

export default store