import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import content from './modules/content'
import contentCategory from './modules/contentCategory'
import contentTag from './modules/contentTag'
import adminUser from './modules/adminUser'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    content,
    contentCategory,
    contentTag,
    adminUser
  },
  getters
})

export default store