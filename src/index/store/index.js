/**
 * @file store index
 * @author dora(doramart@qq.com)
 */

import Vue from 'vue'
import Vuex from 'vuex'
import {
    createAppShellState
} from './modules/app-shell'
import frontendArticle from './modules/frontend-article'
import frontendHeader from './modules/global-header'
import footerConfigs from './modules/global-footer'
import fontendTags from './modules/global-tags'
import fontendAds from './modules/global-ads'
import global from './modules/global'
import fontendMessage from './modules/frontend-messages'
import fontendUser from './modules/frontend-user'
import fontendAdminUser from './modules/frontend-adminuser'


Vue.use(Vuex)

export function createStore() {
    return new Vuex.Store({
        modules: {
            appShell: createAppShellState(),
            frontend: {
                namespaced: true,
                modules: {
                    article: frontendArticle,
                    user: fontendUser,
                    adminUser: fontendAdminUser
                }
            },
            global: {
                namespaced: true,
                ...global,
                modules: {
                    category: frontendHeader,
                    footerConfigs: footerConfigs,
                    message: fontendMessage,
                    tags: fontendTags,
                    ads: fontendAds
                }
            }
        }
    })
}