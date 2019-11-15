const getters = {
  templateConfigList: state => state.templateConfig.myTemplates.templateList,
  templateConfigFormState: state => state.templateConfig.myTemplates.formState,
  templateItemForderList: state => state.templateConfig.myTemplates.templateItemForderList,
  tempShoplist: state => state.templateConfig.tempShoplist,
}
export default getters