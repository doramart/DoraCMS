const getters = {
  mailDeliveryFormState: state => state.mailDelivery.formState,
  sendLogFormState: state => state.mailDelivery.sendLogFormState,
  mailDeliveryList: state => state.mailDelivery.list,
  mailTemplateList: state => state.mailDelivery.templist,
  sendLogList: state => state.mailDelivery.sendLogList,
}
export default getters