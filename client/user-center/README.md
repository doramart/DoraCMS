# User Center Frontend

基于 Vue 3.5 的用户中心前端项目

## 技术栈

- 核心框架：Vue 3.5
- 构建工具：Vite
- 路由管理：Vue Router 4.x
- 状态管理：Pinia
- HTTP 客户端：Axios
- UI 组件库：Element Plus
- 工具库：Lodash
- 开发语言：JavaScript
- 样式预处理器：Sass

## 项目结构

```
user-center/
├── src/
│ ├── api/              # API 接口定义
│ ├── assets/           # 静态资源
│ ├── components/       # 公共组件
│ │ ├── common/         # 基础通用组件
│ │ └── business/       # 业务组件
│ ├── composables/      # 组合式函数
│ ├── config/           # 配置文件
│ ├── layouts/          # 布局组件
│ ├── router/           # 路由配置
│ ├── stores/           # Pinia 状态管理
│ ├── styles/           # 全局样式
│ ├── utils/            # 工具函数
│ └── views/            # 页面组件
├── public/             # 公共资源
└── [配置文件]
```

## 开发环境配置

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 本地预览生产构建

```bash
npm run preview
```

### 代码格式化

```bash
npm run lint
```

## 环境变量配置

项目包含三种环境配置：

- 开发环境：`.env.development`
- 生产环境：`.env.production`
- 测试环境：`.env.test`

主要配置项：

- `VITE_API_BASE_URL`: API 接口地址
- `VITE_ASSETS_URL`: 静态资源地址
- `VITE_APP_TITLE`: 应用标题

## 目录说明

### `api`

包含所有 API 请求定义，按功能模块划分。

### `components`

- `common`: 基础通用组件，例如按钮、表单、列表等。
- `business`: 业务组件，与业务逻辑相关的可复用组件。

### `composables`

Vue 3 组合式 API 的可复用逻辑。

### `config`

应用配置，如区域数据、常量定义等。

### `layouts`

页面布局组件，如默认布局、空白布局等。

### `router`

Vue Router 路由配置。

### `stores`

Pinia 状态管理，按功能模块划分。

### `styles`

全局样式定义，包括变量、混合、重置样式等。

### `utils`

工具函数，如请求封装、日期处理、数据格式化等。

### `views`

页面组件，按功能模块划分。
