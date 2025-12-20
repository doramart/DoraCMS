# CMS3 权限控制链路

## 架构总览
- 权限定义 → `PermissionRegistry` 装载 → 菜单按钮模型存储 → 角色绑定 → 管理员聚合缓存 → `authAdminPower` 中间件执行期校验。该链路贯穿 server 端，前端管理台负责生成并回显按钮/权限配置。
- 项目通过 `server/config/config.default.js:54` 配置注册表、缓存 TTL 以及 `strictMenuBinding` 开关，默认缓存 5 分钟且允许按钮缺省权限标识（可通过配置显式打开强校验）。

## 权限定义与注册
- 所有后端接口权限以 `code + method + path` 的结构集中维护在 `server/app/permission/definitions/manage.js:9`。`aliases` 字段兼容旧版按钮上配置的 `module/action` 形式，避免历史按钮失效。
- 引导阶段由 `server/app.js:238-263` 初始化 `PermissionRegistry`，现在会在加载主应用 definitions 的同时，自动遍历所有启用的插件 `app/permission/definitions/manage.js` 文件，将其一并注册，保证插件路由也拥有同等校验能力。
- 主应用和插件的后端白名单统一由 `config.permission.whiteList` 驱动（默认配置见 `server/config/config.default.js:54-68`），插件可以通过自身配置的 `permissionWhiteList` / `permission.whiteList` 或 `adminApi` 兼容字段扩展；`authAdminPower` 会读取聚合后的 `app.permissionWhiteList`，避免散落在代码中的硬编码。
- `PermissionRegistry` 自身实现了 `register/getByCode/getByLegacyApi/match` 等方法（`server/app/core/permission/PermissionRegistry.js:1-170`），在匹配时同时校验 HTTP 方法与路由正则，保证不同 Method 的 API 能够被精确区分。

## 菜单与按钮层
- 菜单模型（`server/app/model/menu.js:1-57`）中每个按钮携带 `desc/api/permissionCode/httpMethod`，HTTP Method 默认 `POST`，可随 UI 选择。
- `server/app/validate/menu.js:1-63` 和 `:64-128` 对创建/更新请求进行参数约束，包括按钮数组和 HTTP Method 枚举。
- 管理端 `MenuController` 在 `validateButtonSecurity` 中二次校验：按钮 API 必须符合 `module/action` 格式且无危险字符，且在强绑定模式下要求 `permissionCode` 必填且能在注册表中找到定义（`server/app/controller/manage/menu.js:60-97`）。
- 菜单拉取按钮 API/路由的底层由 `MenuMongoRepository` 暴露 `getButtonApis/getMenuButtonsWithPermissionCodes/getMenuRoutePaths` 等方法，便于后续聚合（`server/app/repository/adapters/mongodb/MenuMongoRepository.js:500-575`）。

## 角色授权
- 角色提交时 `controller/manage/role.js:7-58` 会根据已选菜单读取按钮列表，直接以按钮 `permissionCode` 作为唯一键，并在严格模式下拒绝未绑定的权限。
- 角色校验规则在 `server/app/validate/role.js:1-67`，要求按钮数组是字符串集合，对应权限代码。
- 更新、删除角色后会触发管理员权限缓存失效，确保下一次请求重新计算（`server/app/controller/manage/role.js:199-217`）。

## 管理员能力计算与缓存
- `ctx.helper.getAdminPower`（`server/app/extend/helper.js:500-667`）按以下顺序聚合权限：
  1. 读取管理员角色 → 提取有效菜单 ID 与按钮编码；
  2. 查询菜单按钮 API/路由，结合 `PermissionRegistry` 将按钮代码、旧 API 别名映射成最终权限 code；
  3. 在严格模式关闭时，允许 fallback 到菜单路由（适配没有按钮的页面）；
  4. 结果包含 `apis`、`routePaths`、`permissionCodes` 以及对应 definition，写入统一缓存（默认 5 分钟）。
- 缓存失效入口覆盖管理员与角色的增删改：`server/app/controller/manage/admin.js:82,133,177` 和 `server/app/controller/manage/role.js:199,217` 均调用 `ctx.helper.invalidateAdminPowerCache*`（`server/app/extend/helper.js:694-740`），确保权限实时性。

## 请求期权限校验
- `authAdminPower` 中间件（`server/app/middleware/authAdminPower.js:10-220`）是所有 `/manage` API 的最后一道关卡，关键流程：
  - 会话校验与白名单（含插件扩展）；
  - 获取 `getAdminPower` 结果并优先使用 `PermissionRegistry.match` 做 Method + Path 级别的精准判断；
  - 若尚未命中，退化到按钮 API 的严格匹配（支持 `/module/action/:id` 风格）；
  - 仍失败时，针对没有按钮的菜单尝试“路由 → 模块”映射，但包含多重安全限制（路径深度、危险操作名、字符校验）；
  - 拒绝时输出安全日志（记录 userId、请求方法、路径等），在开发环境下记录放行日志，方便审计。

## 前端管理链路
- 菜单抽屉在 `client/admin-center/src/views/manage/menu/modules/menu-operate-modal.vue:190-256`、`:620-709` 中支持录入按钮的 `permissionCode` 与 `httpMethod`，并在初始化时将已有按钮归一化。
- 权限树弹窗 `client/admin-center/src/views/manage/role/modules/menu-auth-modal.vue:1-162` 把后端返回的菜单 + 按钮构造成树节点，按钮节点 ID 取 `permissionCode`。
- 文案与类型定义也在 `client/admin-center/src/locales` 与 `src/typings` 中同步更新，使 UI/TS 层知道新的字段，防止透传缺失。

## 典型权限链路
1. 架构师在 `server/app/permission/definitions/manage.js` 中声明新的权限 code，并在菜单按钮上填入对应 `permissionCode`。
2. 前端（菜单抽屉）录入按钮描述/HTTP Method/API，提交到 `MenuController`，经校验后写入菜单集合。
3. 角色授权时，勾选按钮即把 `permissionCode` 保存到角色记录；管理员绑定角色触发缓存清空。
4. 管理员调用受控 API：`authAdminPower` 读取缓存，使用 `PermissionRegistry.match` 校验 Method + Path；若命中则放行，否则依次尝试按钮 API 与路由映射，失败即拒绝并审计。

## 现状评估与后续建议
- 机制上已经实现“权限定义 → 菜单按钮 → 角色 → 管理员缓存 → 中间件校验”的完整闭环，且提供缓存失效与安全日志。
- 目前 `strictMenuBinding` 默认开启（`server/config/config.default.js:54-58`），按钮必须填写 `permissionCode`，并在权限注册表中声明。
- 权限 definitions 目前覆盖菜单/角色/管理员模块，后续新增业务模块时需同步扩展 definitions，否则 strict 模式会拒绝保存。
- 建议在 CI 中增加对 definitions 与路由文件的比对脚本，确保新增路由必须登记权限，同时可考虑在 `PermissionRegistry` 中输出未被引用的 code 进行巡检。
