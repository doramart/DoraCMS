# DoraCMS 2.1.8

#### 更新内容：
- 服务端代码加入 eslint 校验，并通过 Prettier 格式化（使用 vscode 需要安装对应的插件）
- 修复用户中心分页样式不正确的问题
- 修复使用 ueditor 编辑时，通过剪切板粘贴图片不能上传到 cdn 的问题
- 后台管理添加了选项卡切换
- 后台管理添加了 io 通知，关键操作会通知到管理员
- 修复找回密码链接跳转不正常的问题

![DoraCMS](https://ae01.alicdn.com/kf/H114ba4fd0eab4f36a4b16d970e11222dz.png "DoraCMS")


## DoraCMS 视频简介

[DoraCMS 视频简介](https://www.bilibili.com/video/av77251776/)  

## DoraCMS 更新日志

[DoraCMS 更新日志](https://www.doracms.com/others/update/)  


## 说明

### DoraCMS 使用的技术栈：

```
1、nodejs 12 + eggjs 2
2、vue-cli
3、mongodb 4+
```

文档： [DoraCMS 开发文档](https://www.doracms.com)  
API： [DoraCMS API文档](https://www.html-js.cn/static/apidoc/index.html)  
演示地址： [前端开发俱乐部](https://www.html-js.cn)  

后台登录： https://www.html-js.cn/dr-admin  
测试账号：doracms/123456  


## docker快速体验 `DoraCMS`（本地环境）
> 前提是您需要提前安装 `docker`. 

`DoraCMS` 可以依托 `docker-compose` 快速在本地跑起来，您只需要这样做：


* 下载代码到本地，进入代码根目录，终端执行
```
docker-compose up -d
```
* 接下来等待几分钟，看到执行成功后，浏览器访问
```
http://127.0.0.1:8080/
```

## 安装
### 准备环境
#### 在安装 `DoraCMS` 之前，需要确保您已经完成了以下工作
> [环境准备详情访问](https://www.doracms.com/backend/dev/)  

* 已经安装好了 `nodejs` , 版本 `v12.13.0`
* 已经安装并启动了 `Mongodb`，版本 `4.0`

### 运行
#### 普通用户（无需下载源码）

```
npm i doracms -g  // 全局安装 doracms 命令行工具
dora create mycms  // 本地/服务器环境任意目录执行
```
执行 `dora create mycms` 命令需要填写相关参数（本地环境可以一直回车，会有默认值），相关参数解释如下：
```
?Project name: [必填]项目名称，英文不含空格
?Website(ip or domain): [[非必填，默认 http://127.0.0.1:8080 ]网站访问域名或IP+端口号，需要带http/https,如 https://www.html-js.cn, http://120.25.150.169:8080
?env: [非必填，默认 development ]服务器运行环境
?Server port: [非必填，默认 8080 ]DoraCMS 启动默认端口号，website 中如果也有端口号，那么理论上这两个端口号是相同的
?Mongodb url: [非必填，默认 mongodb://127.0.0.1:27017/doracms2 ] mongodb 连接字符串，如果带密码，eg. mongodb://username:password@127.0.0.1:27017/doracms2
?Mongodb bin path: [非必填，默认为空]Mongodb bin目录路径，注意结尾必须带 / ，windows 环境下路径中 \ 必须改为 / 如 C:/mongodb/mongodb/bin/
```

#### 开发者 (需要下载源码）
[源码搭建开发环境](https://www.doracms.com/backend/dev/) 

### 访问
#### 浏览器通过以下方式访问（具体访问地址依赖于配置）

```
http://127.0.0.1:8080  // 开发环境
http://120.25.150.169:8080  // 生产环境只配了IP，端口号已加入安全组
https://www.html-js.cn // 生产环境配置了域名并做好了域名解析

```


## 其它

### 开发环境启动
```javascript
npm run dev
```

### 生产环境启动
```javascript
pm2 start server.js --name doracms2
```

### 生产环境停止
```javascript
pm2 stop doracms2
```

### 生产环境重启
```javascript
pm2 restart doracms2
```

### api文档
```javascript
api访问地址： http://127.0.0.1:8080/static/apidoc/index.html
```

### 首页
```javascript
http://127.0.0.1:8080
```

### 后台登录
```javascript
http://127.0.0.1:8080/dr-admin
登录账号：doramart/123456    doracms/123456
```


## 技术交流群
<img width="650" src="http://cdn.html-js.cn/contactbywechatqq1.jpg" alt="">


### 捐赠
如果你发现DoraCMS很有用，可以请生哥喝杯咖啡(⊙o⊙)哦
<img width="650" src="http://cdn.html-js.cn/payme.jpg" alt="">

# LICENSE

MIT


