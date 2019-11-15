import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import contentTemp from './modules/contentTemp'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    contentTemp
  },
  getters
})

export default store