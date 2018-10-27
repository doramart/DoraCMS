import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/views/layout/Layout'

/* Router Modules */

import _ from 'lodash';
/** note: Submenu only appear when children.length>=1
 *  detail see  https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 **/

/**
* hidden: true                   if `hidden:true` will not show in the sidebar(default is false)
* alwaysShow: true               if set true, will always show the root menu, whatever its child routes length
*                                if not set alwaysShow, only more than one route under the children
*                                it will becomes nested mode, otherwise not show the root menu
* redirect: noredirect           if `redirect:noredirect` will no redirect in the breadcrumb
* name:'router-name'             the name is used by <keep-alive> (must set!!!)
* meta : {
    roles: ['admin','editor']     will control the page roles (you can set multiple roles)
    title: 'title'               the name show in submenu and breadcrumb (recommend set)
    icon: 'svg-name'             the icon show in the sidebar,
    noCache: true                if true ,the page will no be cached(default is false)
  }
**/
export const constantRouterMap = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path*',
        component: () => import('@/views/redirect/index')
      }
    ]
  },
  {
    path: '/auth-redirect',
    component: () => import('@/views/login/authredirect'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/errorPage/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/errorPage/401'),
    hidden: true
  },
  {
    path: '',
    component: Layout,
    redirect: 'dashboard',
    hidden: true,
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/dashboard/index'),
        name: 'Dashboard',
        meta: { title: 'dashboard', icon: 'dashboard', noCache: true }
      }
    ]
  }
]


export default new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRouterMap
})

/**
 * 将一维的扁平数组转换为多层级对象
 * @param  {[type]} list 一维数组，数组中每一个元素需包含id和parentId两个属性 
 * @return {[type]} tree 多层级树状结构
 */
function buildTree(list) {
  let currentArr = [];
  let temp = {};
  let tree = {};
  for (let i in list) {
    temp[list[i]._id] = list[i];
  }
  for (let i in temp) {
    if (temp[i].parentId && temp[i].parentId != '0') {
      if (!temp[temp[i].parentId].children) {
        temp[temp[i].parentId].children = new Array();
      }
      let currentTemp = renderTemp(temp[i]);
      temp[temp[i].parentId].children.push(currentTemp);
    } else {
      tree[temp[i]._id] = renderTemp(temp[i], true);
    }
  }

  for (var item in tree) {
    currentArr.push(tree[item]);
  }

  return currentArr;
}

function renderTemp(temp, parent = false) {
  if (parent) {
    temp.path = '';
    temp.component = Layout;
  } else {
    temp.path = temp.routePath;
    temp.component = () => import('../views/' + temp.componentPath);
  }
  temp.hidden = !temp.enable;
  temp.name = temp.label;
  temp.meta = {
    title: temp.label
  }
  if (temp.icon) {
    temp.meta.icon = temp.icon;
  }
  return temp;
}

function renderLeftMenu() {
  let cateDataDom = document.getElementById('cateValue');
  let cateList = JSON.parse(cateDataDom.value);
  return buildTree(cateList);
}


let baseRoute = [

  { path: '*', redirect: '/401', hidden: true }
]

let exRoute = renderLeftMenu();
let expendRoute = exRoute.concat(baseRoute);
export const asyncRouterMap = expendRoute;