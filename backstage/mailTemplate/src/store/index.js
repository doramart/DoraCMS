import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import mailTemplate from './modules/mailTemplate'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    mailTemplate
  },
  getters
})

export default store