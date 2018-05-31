# doracms 2.1.0

![DoraCMS](http://7xkrk4.com1.z0.glb.clouddn.com/doracms2.jpg "DoraCMS")

## 2.1.0版本更新

### 版本更新细节：
1、前台使用nunjucks重写(因为模板字符串渲染是最快的)

2、添加了doracms前台后台对国际化的支持（目前支持中文、英文、日文）

3、添加了对缓存超时时间配置支持

4、由于前台使用了nunjucks作为模板引擎，doracms从2.1以后支持换肤功能

5、前台支持IE7,8浏览器

6、针对部分提交内容进行xxs处理，提高系统安全性

7、修复删除后台消息的bug

8、修复删除系统管理员的bug

9、优化了文件目录（setting.js,config等）

10、修复了功能相关的一些bug

### 本次优化总结：
1、改造后的架构有能力支持到IE8, 之前的架构无法实现

2、首页访问速度提升2-3倍

3、内页打开速度进一步提升

4、内存占用小，对服务器要求低

5、支持模板


## 2.0.5版本更新
1、用户中心添加文章功能，用户可以发布文章了，支持markdown语法

2、优化webpack打包流程，压缩lodash，拆分element-ui

3、服务端异常处理

4、用户留言xss处理

5、修复文章点击量不准确的问题

6、修复在开发环境下，后台切换登录超级管理员和测试管理员，左侧菜单没有变化的问题

7、首页添加了用户留言模块，以及推荐模块

8、优化相关样式和界面布局

9、修复了其它bug


更新方法： 
1、checkout 最新 2.0.5 代码

2、删除 node_modules,重新安装依赖包

3、启动数据库，执行npm run dev 


## 说明

DoraCMS 使用的技术栈：

1、vue + vuex + vue-router 全家桶

2、webpack 2

3、nodejs 8.1 + express 4

4、mongodb 3+

演示地址： [前端开发俱乐部](https://www.html-js.cn)
后台登录： https://www.html-js.cn/dr-admin     测试账号：doracms/123456

开发文档： [前端内容管理框架 DoraCMS2.0 开发文档](https://www.html-js.cn/details/ryn2kSWqZ.html)   
生产部署教程： [DoraCMS2.0 linux部署(生产环境)教程](https://www.html-js.cn/details/ry4-B-hkf.html)  


## 目录结构

```
├─build // webpack 相关配置文件
│
├─configs // 配置文件
│  │  
│  └─logConfig.js  // 日志配置文件
│ 
├─logs // 日志目录
│
├─dist  // webpack 生成文档存放目录
│  │
│  ├─server
│  │
│  └─static
│      ├─css
│      │
│      ├─images
│      │
│      ├─img
│      │
│      └─js
│
├─server    // 服务端目录
│  │
│  ├─lib    // 核心层
│  │
│  └─routes // 路由文件
│
├─src           // 客户端程序目录
│  │
│  ├─api        // api 配置文件
│  │
│  ├─filters    // 过滤器
│  │
│  ├─index      // 前台组件
│  │
│  ├─manage     // 后台组件
│  │
│  ├─template   // 初始模版
│  │
│  └─utils      // 实用工具
│
└─utils
    ├─middleware // 中间件
    │
    ├─authPower.js // 资源鉴权
    │
    ├─authSession.js // session 鉴权
    │
    ├─authToken.js // token鉴权
    │
    ├─logUtil.js // 日志配置
    │
    ├─settings.js // 关键信息配置
    │
    └─validatorUtil.js // 信息校验

```





## 准备工作:
安装 NodeJS:
https://nodejs.org/zh-cn/

安装 Mongodb:
https://www.mongodb.com/download-center#community

```shell
# 安装依赖
$ npm install

# 开发模式
$ npm run dev

# 生产模式
$ npm run build

# 启动(需先生成静态文件)
$ npm run start
```

首页
http://localhost:8080

登录
http://localhost:8080/dr-admin

# 捐赠
如果你发现DoraCMS很有用，可以请生哥喝杯咖啡(⊙o⊙)哦
<img width="650" src="http://7xkrk4.com1.z0.glb.clouddn.com/payme.jpg" alt="">

# LICENSE

MIT
