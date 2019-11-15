import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import contentCategory from './modules/contentCategory'
import contentTemplate from './modules/contentTemplate'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    contentCategory,
    contentTemplate
  },
  getters
})

export default store