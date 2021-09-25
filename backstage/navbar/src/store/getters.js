const getters = {
  sidebar: (state) => state.app.sidebar,
  showSideBar: (state) => state.user.showSideBar,
  device: (state) => state.app.device,
  token: (state) => state.user.token,
  avatar: (state) => state.user.avatar,
  tabs: (state) => state.user.tabs,
  activeTab: (state) => state.user.activeTab,
  singleTabs: ({ user: userInfo }) => {
    let thisTabs = [];
    if (userInfo && userInfo.tabs) {
      for (const tabItem of userInfo.tabs) {
        thisTabs.push(tabItem.path);
      }
    }
    return thisTabs;
  },
  name: (state) => state.user.name,
  routes: (state) => state.user.routes,
  singleUserFormState: (state) => state.singleUser.formState,
  singleUserRegFormState: (state) => state.singleUser.regFormState,
  singleUserInfo: (state) => state.singleUser.userInfo,
  singleUserToken: (state) => state.singleUser.token,
  singleUserName: (state) => state.singleUser.name,
};
export default getters;
