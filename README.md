# DoraCMS 2.0.1

![DoraCMS](http://7xkrk4.com1.z0.glb.clouddn.com/doracms2.jpg "DoraCMS")

## 2.0.1版本更新
1、注册用户登出后，仍然可以访问用户中心的问题

2、添加了管理员登录验证码

3、修复了类别管理enable字段设置无效的问题

4、处理用户发布或回复留言邮件通知不到的问题

5、修复后台管理留言管理模块管理员回复用户，或者用户回复管理员，有些用户名无法显示的问题

6、修复了开发环境下，报mongodb错误的问题

7、增加了一种橱窗广告展示类型

8、修复了在开发环境下，添加文章由于缓存不显示的问题

9、添加了转载标识

10、修复了类别切换时会先显示老数据，闪一下后显示新数据的问题

## 更新方法： 

1、checkout 最新 2.0.1 代码

2、删除 node_modules,重新安装依赖包

3、启动数据库，执行npm run dev 


## 说明

DoraCMS 使用的技术栈：

1、vue + vuex + vue-router 全家桶

2、webpack 2

3、nodejs 8.0 + express 4

4、mongodb 3+

演示地址： [前端开发俱乐部](https://www.html-js.cn)   
后台登录： https://www.html-js.cn/dr-admin     测试账号：doracms/123456

部署文档： [前端内容管理框架 DoraCMS2.0 部署介绍](https://www.html-js.cn/details/ryn2kSWqZ.html)   

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
