import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import mailDelivery from './modules/mailDelivery'


Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    mailDelivery
  },
  getters
})

export default store