const getters = {
  adminGroupFormState: state => state.adminGroup.formState,
  adminGroupRoleFormState: state => state.adminGroup.roleFormState,
  adminGroupList: state => state.adminGroup.roleList,
  adminResourceList: state => state.adminResource.resourceList,
}
export default getters