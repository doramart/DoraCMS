import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import ads from './modules/ads'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    ads,
  },
  getters
})

export default store