# DoraCMS 2.0.4

![DoraCMS](http://7xkrk4.com1.z0.glb.clouddn.com/doracms2.jpg "DoraCMS")

## 2.0.4版本更新

1、添加系统支持redis缓存，通过开关控制，并添加通过redis缓存数据中间件。要知道redis在存储性能方面MongoDB要好很多（主要存储session数据）

2、重新整理了样式，组件样式全部单独提取，提高可维护性。

3、文档详情页添加了“喜欢”功能。

4、修复了某些场景下批量删除留言异常的bug。

5、添加了二维码分享功能。

6、添加了回到顶部按钮。

7、优化了包括 最新文档、近期文档、推荐文档等模块的代码结构。

8、优化了用户中心的界面和交互。

9、修复页面跳转后滚动条不置顶的问题。

10、修复了某些场景下通过标签查询，分页异常的问题。

11、优化了cms在移动端的显示。

12、修复了一些明显bug



## 更新方法：

1、checkout 最新 2.0.4 代码

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
# 初始化数据库
$ npm init

# 安装依赖
$ npm install

# 开发模式
$ npm run dev

# 生产模式
$ npm run build

# 启动(需先生成静态文件)
$ npm run start

# 备份数据库
$ npm dump
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
