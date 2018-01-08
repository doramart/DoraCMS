/**
 * @author doramart
 * Date: 18/01/03
 */
import Vue from 'vue'
import {
    Pagination,
    Dialog,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Menu,
    Submenu,
    MenuItem,
    MenuItemGroup,
    Input,
    InputNumber,
    Select,
    Button,
    ButtonGroup,
    Table,
    TableColumn,
    Popover,
    Tooltip,
    Form,
    FormItem,
    Slider,
    Row,
    Col,
    Upload,
    Badge,
    Card,
    Carousel,
    CarouselItem,
    Cascader,
    Loading,
    MessageBox,
    Message
} from 'element-ui'
let variable = {
    Pagination,
    Dialog,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Menu,
    Submenu,
    MenuItem,
    MenuItemGroup,
    Input,
    InputNumber,
    Select,
    Button,
    ButtonGroup,
    Table,
    TableColumn,
    Popover,
    Tooltip,
    Form,
    FormItem,
    Slider,
    Row,
    Col,
    Upload,
    Badge,
    Card,
    Carousel,
    CarouselItem,
    Cascader
}
for (let item in variable) {
    if (variable.hasOwnProperty(item)) {
        Vue.use(variable[item])
    }
}

Vue.use(Loading.directive)

Vue.prototype.$loading = Loading.service
Vue.prototype.$msgbox = MessageBox
Vue.prototype.$alert = MessageBox.alert
Vue.prototype.$confirm = MessageBox.confirm
Vue.prototype.$prompt = MessageBox.prompt
// Vue.prototype.$notify = Notification
Vue.prototype.$message = Message

export default Vue


