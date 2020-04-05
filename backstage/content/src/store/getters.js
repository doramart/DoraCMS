const getters = {
  contentFormState: state => state.content.formState,
  contentList: state => state.content.contentList,
  directUserFormState: state => state.content.directUser.formState,
  moveCateFormState: state => state.content.moveCate.formState,
  contentCategoryList: state => state.contentCategory.categoryList,
  contentTagList: state => state.contentTag.tagList,
  adminUserInfo: state => state.adminUser.userInfo,
  contentCoverDialog: state => state.content.contentCoverDialog,
  contentCoverList: state => state.content.contentCoverList,
  draftContentDialog: state => state.content.draftContentDialog,
  draftContentList: state => state.content.draftContentList,
}
export default getters