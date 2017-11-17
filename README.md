# DoraCMS 2.0.2

![DoraCMS](http://7xkrk4.com1.z0.glb.clouddn.com/doracms2.jpg "DoraCMS")

## 2.0.2版本更新
1、升级log4js到最新版本

2、前台后台实现懒加载

3、优化管理界面首页布局，增加权限预览

4、优化了后台导航交互

5、修复后台更改分页数pageSize，查询结果不变的问题

6、修复某些情况下，后台查询关键字后，分页显示错误的问题

7、修复某些情况下，数据备份压缩包内容为空的问题 (nodejs 需升级到 v8.1.0或以上)

8、优化前台个人中心布局，添加修改用户头像功能

9、登录，注册，搜索支持回车键

10、修复管理员管理中点击编辑按钮后，datatable中group清空的问题

11、其它bug修复

## 更新方法： 

1、checkout 最新 2.0.2 代码

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
