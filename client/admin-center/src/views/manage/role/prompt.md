# 界面优化需求说明

## 一、界面概述
界面 A（`/src/views/manage/role/modules/menu-auth-modal.vue`）用于在配置完角色基本信息后，进一步配置基于该角色的菜单权限。现需对该界面进行调整，实现以下具体功能。

## 二、功能要求

### 1. 菜单显示
用户点击编辑菜单后，界面应显示树状结构菜单。若菜单下存在按钮（`buttons`），需在树节点最后一层将按钮遍历显示出来，所有节点带复选框。树节点默认勾选项由父组件 `role-operate-drawer.vue`传入

### 2. 数据收集
界面 A 需收集用户勾选的菜单 _id 与按钮的代码 code。

### 3. 数据回传
用户点击提交后，将 `roleIds` 和 `buttonCodes` 回传给父组件。父组件最终的数据结构如下：
```json
{
    "_id": "IJHKKDJKF8",
    "createBy": "Ronald Williams",
    "createTime": "1974-08-21 20:41:42",
    "updateBy": "Charles Jones",
    "updateTime": "2017-05-02 05:18:42",
    "status": "1",
    "menus": ["11111", "22222", "33333"],
    "buttons": ["11111", "22222", "33333"],
    "roleName": "icre",
    "roleCode": "R_HLMV_MYFJD",
    "roleDesc": "Ewytlri mfarfmn dolqdssgq."
}
```
注意：在父组件(role-operate-drawer.vue)中，角色基本信息 `model.value` 中已经包含了除 `menus`和`buttons`以外的全部属性

### 4. 代码规范
请基于当前代码规范进行编码，可能需要修改以下文件：
- `/src/views/manage/role/modules/menu-auth-modal.vue`
- `src/views/manage/role/modules/role-operate-drawer.vue`
- `src/views/manage/role/index.vue`
- 其他相关联文件

## 三、相关信息

### 1. 父组件路径
`src/views/manage/role/modules/role-operate-drawer.vue`

### 2. 菜单数据获取
获取全部菜单的方法为 `fetchGetMenuList`（来自 `src/service/api/system-manage.ts`），返回的数据结构可参考文件 `src/views/manage/role/modules/menu-list.json`。