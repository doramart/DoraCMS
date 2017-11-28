# DoraCMS 2.0.3

![DoraCMS](http://7xkrk4.com1.z0.glb.clouddn.com/doracms2.jpg "DoraCMS")

## 2.0.3版本更新

1、上传缩略图支持七牛云存储

2、取消在后台首页显示用户敏感信息，提高安全性

3、管理员登录md5加密 ![#87](https://github.com/doramart/DoraCMS/pull/87 "#87")

4、修复描述信息不是必填项，但是也验证了 ![#91](https://github.com/doramart/DoraCMS/issues/91 "#91")

5、站点地图域名可配置

6、统一端口号配置

7、修复管理员在留言管理中 对某个会员 回复信息， 然后再给自己（doramart）回复信息后，进入系统主页浏览器报错的问题![#93](https://github.com/doramart/DoraCMS/issues/93 "#93")

8、修复修改管理员信息没有改手机号却提示手机号格式不正确的问题 ![#92](https://github.com/doramart/DoraCMS/pull/92 "#92")

9、前台后台添加404页面

10、后台没有权限的菜单不显示

11、修复了一些样式问题


## 更新方法：

1、checkout 最新 2.0.3 代码

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
