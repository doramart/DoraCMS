import Vue from 'vue'
import Router from 'vue-router'
import store from '../store/index.js'
import Home from '../components/Home'
import NotFind from '../components/errors/404.vue'
import Axios from "axios";
import _ from 'lodash';
Vue.use(Router)



let router = new Router({
  routes: renderLeftMenu()
})

function renderLeftMenu() {
  let cateDataDom = document.getElementById('cateValue'), catelist = [];
  catelist = JSON.parse(cateDataDom.value);
  let addNewRoutes = [
    {
      path: '/',
      redirect: '/main',
      hidden: 'true'
    }
  ];
  let treeData = catelist;

  let newResult = [].concat(treeData);
  let delAtArr = [];
  let childArr = _.filter(treeData, (doc) => {
    return doc.parentId != '0'
  });

  for (let i = 0; i < childArr.length; i++) {
    let child = childArr[i];
    for (let j = 0; j < treeData.length; j++) {
      let treeItem = treeData[j];
      treeItem.children = treeItem.children || [];
      if (treeItem._id == child.parentId) {
        treeItem.children.push(child);
        break;
      }
    }
  }
  newResult = _.filter(treeData, (menu) => {
    return menu.parentId == '0'
  });
  newResult.map((item, index) => {
    // TODO 目前只支持二级
    let childrenMenu = [];
    let childItem = item.children;
    let renderChildren = (childrenArr) => {
      if (childrenArr && childrenArr.length > 0) {
        (item.children).map((child, index) => {
          childrenMenu.push({
            path: '/' + child.routePath,
            component: () => import('../components/' + child.componentPath),
            name: child.label,
            hidden: !child.enable
          })
        })
      }
    }
    renderChildren(childItem);
    let parentMenu = {
      path: '/',
      component: Home,
      name: item.label,
      iconCls: item.icon ? 'fa fa-' + item.icon : 'fa fa-user',
      hidden: !item.enable,
      children: childrenMenu
    }
    addNewRoutes.push(parentMenu);
  })
  addNewRoutes.push({ path: '*', component: NotFind, hidden: 'true' });
  return addNewRoutes;
}


router.beforeEach((to, from, next) => {
  if (to.fullPath == '/') {

  }
  next();
})

export default router;