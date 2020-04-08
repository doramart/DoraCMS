# DoraCMS 2.1.6

![DoraCMS](https://ae01.alicdn.com/kf/H114ba4fd0eab4f36a4b16d970e11222dz.png "DoraCMS")


## DoraCMS 视频简介

[DoraCMS 视频简介](https://www.bilibili.com/video/av77251776/)  



## 2.1.6 版本更新

* `api` 文档换成 `swagger-ui`
* 修复 `gulp` 不兼容 `node 12+` 的问题
* 修改了后台密码的加密方式
* 文档添加加入了自动生成缩略图功能
* 文档管理加入了回收站功能
* 加入插件功能
* 加入数据恢复功能
* 补充国际化文件
* 修复了一些其它bug


## 说明

### DoraCMS 2.1.6 使用的技术栈：

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


## 快速开始体验 `DoraCMS`（推荐）
> 前提是您需要提前安装 `docker`. 这里介绍的是本地体验，如果你想运行在服务器上，需要先修改配置文件 config/config.local.js 里的 `server_path` `server_api` 为您服务器的 `IP` + `端口号`。__该操作仅为快速体验__，如果正式环境部署，请移步后面的 __`如何安装 DoraCMS（开发环境/生产环境）`__

`DoraCMS` 可以依托 `docker-compose` 快速在本地跑起来，您只需要这样做：


* 下载代码到本地，进入代码根目录，终端执行
```
docker-compose up -d
```
接下来等待几分钟，看到执行成功后，浏览器访问
```
http://127.0.0.1:8080/
```

## 如何安装 `DoraCMS`（开发环境/生产环境）
### 在安装 `DoraCMS` 之前，需要确保您已经完成了以下工作

* 已经安装好了 `nodejs` , 版本 `v12.13.0`
* 已经安装并启动了 `Mongodb`，版本 `4.0`

### 安装 `DoraCMS` 只需要一步
> 在完成上述准备工作后，代码根目录下执行(如果下次重新执行，需要重新checkout代码回到仓库原始状态)

```
npm run doracms
```

## 下面就按照上面的步骤详细讲解：
### 下载并安装 `nodejs`
`nodejs` 可以去官网下载，你可以去 [安装包列表](https://nodejs.org/dist/latest-v10.x/) 中找到需要的安装包，具体的安装方式可自行百度。
```javascript
https://nodejs.org/dist/latest-v10.x/node-v12.13.0.pkg  // Mac Pro
https://nodejs.org/dist/latest-v10.x/node-v12.13.0-x64.msi  // windows 64位
https://nodejs.org/dist/latest-v10.x/node-v12.13.0-x86.msi  // windows 32位
```
安装完成后，打开终端，确认是否安装成功
```
node -v // v12.13.0
```

### 安装 `mongodb`
去官网下载 `mongodb`，根据您的安装环境选一个不是最新的版本，这里以 `Mac` 为例, [下载地址](https://www.mongodb.com/download-center#community)
```javascript
https://fastdl.mongodb.org/osx/mongodb-osx-ssl-x86_64-4.0.16.tgz  // Mac 安装包地址
```
![下载mongodb](https://cdn.html-js.cn/cms/upload/images/WX20200314-230207@2x.png)

解压后的目录结构

![目录结构](https://cdn.html-js.cn/cms/upload/images/WX20200314-230731@2x.png)



### 启动 `mongodb`
> 不同平台启动 mongodb 方式基本相同

#### 新建配置文件 `mongodb.config`
```
dbpath=/Users/dora/Documents/dora/softs/mongodb/data/  #数据存放路径

logpath=/Users/dora/Documents/dora/softs/mongodb/log/mongodb.log #日志存放路径

fork=true #进程守护

#auth=true #是否鉴权
```
`auth` 代表鉴权，这里演示的是本地启动，可以不要密码，因此注释掉了，在生产环境上 `auth` 必须为 `true`,且 `mongodb` 要配置密码。详情查询 [DoraCMS生产环境部署](https://www.doracms.com/backend/prod.html) 里的第七步，详细介绍了如何给 `mongodb` 加密码

#### 启动 `mongodb`

终端执行

```
mongod --config C:\mongodb\mongod.conf 
```

![mongodb启动](https://cdn.html-js.cn/cms/upload/images/Snipaste_2020-03-14_23-57-05.png)

可以看到结尾处提示 `mongodb` 启动成功了


### 启动项目

#### 修改配置文件

> install -> serverConfig.js，根据实际情况修改，配置文件中的备注很明确，请仔细阅读

```
cd install
vim serverConfig.js
```
##### 参数配置详情
> 一定要注意 `mongodbBinPath` ,在 `windows` 环境下路径中 `\` 必须改为 `/` 如 `C:/mongodb/mongodb/bin/` 才是正确的，另外，`bin` 路径中不要包含中文或空格

```
/**
 * 服务器配置信息
 * @param  {String} env            [[必填]服务器环境 development:开发环境，production:生产环境]
 * @param  {String} mongodbBinPath [[必填]Mongodb bin目录路径，注意结尾必须带 / ，windows 环境下路径中 \ 必须改为 / 如 C:/mongodb/mongodb/bin/ ]
 * @param  {String} dbIP           [[必填]Mongodb 数据库IP，默认 127.0.0.1 默认不用更改]
 * @param  {String} dbPort         [[必填]Mongodb 数据库端口号，默认为 27017 默认不用更改]
 * @param  {String} dbName         [Mongodb 数据库名称，默认为 doracms2 默认不用更改]
 * @param  {String} dbUserName     [Mongodb 数据库用户名，没有可以不填，和 dbPassword 同时存在或同时为空]
 * @param  {String} dbPassword     [Mongodb 数据库密码，没有可以不填，和 dbUserName 同时存在或同时为空]
 * @param  {String} os             [[必填]服务器平台 Mac,Windows,Linux 可选]
 * @param  {String} domain         [[必填]网站访问域名或IP+端口号，需要带http/https,如 https://www.html-js.cn, http://120.25.150.169:8080]
 * @param  {String} port           [[必填]DoraCMS 启动默认端口号，domain 中如果也有端口号，那么理论上这两个端口号是相同的]
 * @param  {String} tbAgent        [[必填]NPM安装包是否启用淘宝代理 1：启用 0：不启用，建议启用]
 */

 const serverConfig = {
    env: "development",
    mongodbBinPath: "C:/mongodb/mongodb/bin/",
    dbIP: "127.0.0.1",
    dbPort: "27017",
    dbName: "doracms2",
    dbUserName: "",
    dbPassword: "",
    os: "Windows",
    domain: "http://127.0.0.1:8080",
    port: 8080,
    tbAgent: "1",
}

module.exports = serverConfig;
```

#### 代码根目录执行

> 此处通过执行脚本省去了安装依赖，配置文件修改等操作，大概需要几分钟的时间，请耐心等待，如果有提示错误，请根据提示做相应的调整

```
npm run doracms
```

#### 浏览器通过以下方式访问（具体访问地址依赖于第一步的配置）

```
http://127.0.0.1:8080  // 开发环境
http://120.25.150.169:8080  // 生产环境只配了IP，端口号已加入安全组
https://www.html-js.cn // 生产环境配置了域名并做好了域名解析

```

## 如果你不想看那么多文字，这里为你准备了视频，更加直观

[Windows 下开发环境搭建](https://www.bilibili.com/video/av77251989/)  



> 网站图片资源可从这里获取
下载链接: https://pan.baidu.com/s/1th7Qlz4eJGNN3w_Tacl9AQ 提取码: jczt  ，解压后放到项目根目录下 app/public/upload (替换)。

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

### 清空数据
```javascript
启动mongodb（执行mongodb安装目录下mongod.exe），cmd窗口打开mongo.exe
// 查看数据库列表
show dbs
// 查看集合列表
show collections
// 使用数据库doracms2
use doracms2
// 清除所有文章信息
db.contents.find()
db.contents.remove({})
// 清除所有留言信息
db.messages.find()
db.messages.remove({})
```

## 技术交流群
<img width="650" src="http://cdn.html-js.cn/contactbywechatqq1.jpg" alt="">


### 捐赠
如果你发现DoraCMS很有用，可以请生哥喝杯咖啡(⊙o⊙)哦
<img width="650" src="http://cdn.html-js.cn/payme.jpg" alt="">

# LICENSE

MIT


