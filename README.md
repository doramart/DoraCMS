# DoraCMS 2.1.5

![DoraCMS](https://ae01.alicdn.com/kf/H114ba4fd0eab4f36a4b16d970e11222dz.png "DoraCMS")


## DoraCMS 视频简介

[DoraCMS 视频简介](https://www.bilibili.com/video/av77251776/)  



## 2.1.5 版本更新

* 抽离了邮件发送为独立插件
* 新增邮件管理，管理邮件模板，可以批量定时发送邮件
* 优化了绑定编辑的逻辑
* 内容管理添加了分类筛选，并增加了导入word 格式的功能
* 优化了分类管理的样式和删除逻辑
* 修复了管理员编辑，角色无法正确读出的问题以及编辑管理员信息偶尔会导致密码被改动的问题
* 系统配置中加入了网站logo上传功能
* 修复了在宽屏下默认模板会拉长的问题
* 后台管理图标优化以及细节修改


## 说明

### DoraCMS 2.1.5 使用的技术栈：

```
1、nodejs 10 + eggjs 2
2、vue-cli
3、mongodb 4+
```

文档： [DoraCMS 开发文档](https://www.doracms.com)  
演示地址： [前端开发俱乐部](https://www.html-js.cn)  

后台登录： https://www.html-js.cn/dr-admin  
测试账号：doracms/123456  


## 如何安装 `DoraCMS`
### 在安装 `DoraCMS` 之前，需要确保您已经完成了以下工作

* 已经安装好了 `nodejs` , 版本 `v10.19.0`
* 已经安装并启动了 `Mongodb`，版本 `4.0`
* 服务器设置了 nodejs 环境变量，并将 mongodb bin目录加入到了环境变量

### 安装 `DoraCMS` 只需要一步
> 在完成上述准备工作后，代码根目录下执行

```
npm run doracms
```

## 下面就按照上面的步骤详细讲解：
### 下载并安装 `nodejs`
`nodejs` 可以去官网下载，你可以去 [安装包列表](https://nodejs.org/dist/latest-v10.x/) 中找到需要的安装包，具体的安装方式可自行百度。
```javascript
https://nodejs.org/dist/latest-v10.x/node-v10.19.0.pkg  // Mac Pro
https://nodejs.org/dist/latest-v10.x/node-v10.19.0-x64.msi  // windows 64位
https://nodejs.org/dist/latest-v10.x/node-v10.19.0-x86.msi  // windows 32位
```
安装完成后，打开终端，确认是否安装成功
```
node -v // v10.19.0
```

### 安装 `mongodb`
去官网下载 `mongodb`，根据您的安装环境选一个不是最新的版本，这里以 `Mac` 为例, [下载地址](https://www.mongodb.com/download-center#community)
```javascript
https://fastdl.mongodb.org/osx/mongodb-osx-ssl-x86_64-4.0.16.tgz  // Mac 安装包地址
```
![下载mongodb](https://cdn.html-js.cn/cms/upload/images/WX20200314-230207@2x.png)

解压后的目录结构

![目录结构](https://cdn.html-js.cn/cms/upload/images/WX20200314-230731@2x.png)

### 添加环境变量，不同平台添加方式有所不同
#### Windows
> windows 下添加环境变量有时候需要重启电脑才能生效
* 添加 `nodejs` 环境变量

![输入图片说明](https://cdn.html-js.cn/cms/upload/images/Snipaste_2020-03-14_23-17-24.png)

终端查看是否生效
```
node
process.env.NODE_ENV
```
![终端校验](https://cdn.html-js.cn/cms/upload/images/WX20200314-232407@2x.png)


* 添加 `mongodb bin` 目录到 `path` 环境变量

![环境变量](https://cdn.html-js.cn/cms/upload/images/Snipaste_2020-03-14_23-37-53.png)

终端查看是否生效
```
mongod --help
```
![环境变量](https://cdn.html-js.cn/cms/upload/images/Snipaste_2020-03-14_23-40-24.png)

#### Mac

* 直接在配置文件中添加 

```javascript
vim ~/.bash_profile
export NODE_ENV=development
#下面为mongodb bin 路径
MONGODBPATH=/Users/Dora/Documents/dora/soft/mongodb/bin
PATH="${MONGODBPATH}:${PATH}"
export PATH
```
修改完之后需要 `source` 一下使其生效
```
source ~/.bash_profile
```
终端查看效果
```
echo $NODE_ENV
```
![终端校验](https://cdn.html-js.cn/cms/upload/images/WX20200314-232153@2x.png)

#### Ubuntu(服务器，生产环境)
> 和 mac 类似，只是修改的文件有所不同

* 直接在配置文件中添加 

```javascript
vim /etc/profile
export NODE_ENV=production
#下面为mongodb bin 路径
MONGODBPATH=/home/Dora/Documents/dora/soft/mongodb/bin
PATH="${MONGODBPATH}:${PATH}"
export PATH
```
修改完之后需要 `source` 一下使其生效
```
source /etc/profile
```
终端查看效果
```
echo $NODE_ENV
```
![输入图片说明](https://cdn.html-js.cn/cms/upload/images/WX20200314-232942@2x.png)


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

> install -> serverConfig.js，开发环境可以不用改，生产环境根据实际情况修改，配置文件中的备注很明确，请仔细阅读

```
cd install
vim serverConfig.js
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

### 开发模式启动
```javascript
npm run dev
```

### 生产模式启动
```javascript
npm start
```

### 生产模式停止
```javascript
npm run stop
```

### 生成api文档
```javascript
npm run makePrdDoc

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


