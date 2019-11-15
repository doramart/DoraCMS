const getters = {
  contentFormState: state => state.content.formState,
  contentList: state => state.content.contentList,
  directUserFormState: state => state.content.directUser.formState,
  contentCategoryList: state => state.contentCategory.categoryList,
  contentTagList: state => state.contentTag.tagList,
}
export default getters