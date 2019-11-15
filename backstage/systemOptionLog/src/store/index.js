import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import systemOptionLog from './modules/systemOptionLog'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    systemOptionLog
  },
  getters
})

export default store