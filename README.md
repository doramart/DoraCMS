# DoraCMS 2.1.3

![DoraCMS](https://www.html-js.cn/upload/images/ueditor/1041325089330696192.png "DoraCMS")

## 2.1.3 版本更新
1、优化了代码整体的目录结构 ++[重要]++  

2、修复了后台文章列表编辑时文章作者和文章分类无法带出的问题  

3、重构了服务端代码，使其具有前后台api分离的能力 ++[重要]++  

4、支持最新稳定版nodejs（已通过 nodejs v10.15.0测试）++[重要]++  

5、优化打包脚本，npm run build 执行速度提升30%  

6、优化开发模式下修改文件后的自动重启速度  

7、默认redis开关关闭，可以不开启。 ++[重要]++  

8、修复了一些其他bug  




注意：
1、如果在开发环境下，只涉及到服务端调试，请使用：
```javascript
npm run server  
```

如果是普通调试，依然是
```javascript
npm run dev
```
2、api开发请按照当前代码中的规范，开发完成后执行生成api文档：
```javascript
npm run makePrdDoc
```

通过如下方式访问
```javascript
http://localhost:8080/apidoc
```

## 说明

### DoraCMS 使用的技术栈：

```
1、vue + vuex + vue-router 全家桶
2、webpack 2
3、nodejs 10.15.0 + express 4
4、mongodb 4+
```

演示地址： [前端开发俱乐部](https://www.html-js.cn)  

后台登录： https://www.html-js.cn/dr-admin  
测试账号：doracms/123456  

 [DoraCMS 2.1.3 尝鲜体验](https://www.html-js.cn/details/VmnGNiF4S.html)   

 [DoraCMS v2.1.2 Docker 版本（生产环境）](https://www.html-js.cn/details/Bkw5AepT4.html)  


## 目录结构

```javascript
├─build // webpack 相关配置文件
│
├─client // 客户端文件(前台/后台)
│  │
│  ├─index      // 前台组件
│  │
│  ├─manage     // 后台组件
│  │
│  └─template   // 初始模版
│
├─databak // 默认数据备份目录
│
│ 
├─logs // 日志目录
│
├─public  // 静态文件目录
│  │
│  ├─admin // 后台vue编译后的文件目录
│  │
│  ├─apidoc // api文档目录
│  │
│  ├─plugins // 前台依赖的相关组件
│  │
│  ├─themes // 皮肤目录
│  │
│  ├─ueditor // ueditor插件目录
│  │
│  ├─upload // 文件上传目录
│  │
│  └─vendor // 后台静态dll目录
│
│
├─server    // 服务端目录
│  │
│  ├─bootstrap   // 前台渲染相关
│  │
│  ├─configs   // 系统配置
│  │
│  ├─locales   // 国际化
│  │
│  ├─middleware   // 中间件
│  │
│  │
│  ├─lib    // 核心层
│  │  ├─contorller   // 控制器
│  │  │
│  │  ├─model   // 数据模型
│  │  │
│  │  ├─service   // 数据库操作
│  │  │
│  │  └─utils
│  │     ├─cache // redis缓存
│  │     │
│  │     ├─memoryCache // 内存缓存
│  │     │
│  │     ├─authPower.js // 资源鉴权
│  │     │
│  │     ├─authSession.js // session 鉴权
│  │     │
│  │     ├─authToken.js // token鉴权
│  │     │
│  │     ├─mime.js // 文件类型
│  │     │
│  │     ├─siteFunc.js // 公共方法
│  │     │
│  │     └─validatorUtil.js // 信息校验
│  │
│  │
│  └─routers   // 路由
│  
│
│
└─views          // 前台模板
   │
   ├─dorawhite   // 主题目录
   │
   ├─admin.html    // 后台管理模板
   │
   └─adminUserLogin.html    // 后台登录模板
 

```





## 开发环境准备工作:

### 安装最新稳定版 NodeJS:
```javascript
https://nodejs.org/zh-cn/
```


### 安装并启动 Mongodb (++mongodb不要设置密码访问++)
```javascript
https://www.mongodb.com/download-center#community
```

### 安装全局依赖
```javascript
npm install pm2 -g   // nodejs进程守护
npm install apidoc -g  // api 文档生成
npm install gulp -g  // 脚本构建
npm install nodemon -g  // nodejs 代码监控
```


### 安装本系统依赖（代码根目录）
```javascript
npm install
```

### 初始化数据
```javascript
npm run init
```

### 设置环境变量（以mac为例，修改 .bash_profile文件）

```javascript
vi ~/.bash_profile

export NODE_ENV=development
MONGODBPATH=/Users/Dora/Documents/dora/soft/mongodb/bin
PATH="${MONGODBPATH}:${PATH}"
export PATH

source ~/.bash_profile
```

> 以上步骤做了两件事情：  
1、设置nodejs环境变量为 development,生产环境记得改为 production  
2、将mongodb bin 目录添加到全局变量中，便于在终端的任何位置执行mongo脚本,注意改成自己安装mongodb的实际路径  


### 开发模式启动
```javascript
npm run dev
```
### 生产模式打包
```javascript
npm run build
```
### 生产模式启动(进入代码根目录执行)
```javascript
node server.js
```

### 首页
```javascript
http://localhost:8080
```

### 后台登录
```javascript
http://localhost:8080/dr-admin
登录账号：doramart/123456    doracms/123456
```

## 捐赠
如果你发现DoraCMS很有用，可以请生哥喝杯咖啡(⊙o⊙)哦
<img width="650" src="http://cdn.html-js.cn/payme.jpg" alt="">

# LICENSE

MIT


