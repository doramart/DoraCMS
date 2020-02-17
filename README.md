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

#### 注意：2.1.5 版本新增的插件中添加了两个依赖，您需要在合并代码后，分别在以下两个目录下执行 npm install 单独安装依赖

```
cd lib/plugin/egg-dora-content
npm install
cd lib/plugin/egg-dora-maildelivery
npm install
```
## 说明

### DoraCMS 2.1.5 使用的技术栈：

```
1、nodejs 12.13.0 + eggjs 2
2、vue-cli
3、mongodb 4+
```

文档： [DoraCMS 开发文档](https://www.doracms.com)  
演示地址： [前端开发俱乐部](https://www.html-js.cn)  

后台登录： https://www.html-js.cn/dr-admin  
测试账号：doracms/123456  


## Windows 下开发环境搭建

[Windows 下开发环境搭建](https://www.bilibili.com/video/av77251989/)  


## MAC OS 开发环境搭建

### 安装最新稳定版 NodeJS (12.13.0):
```javascript
https://nodejs.org/zh-cn/
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



### 安装并启动 Mongodb (++mongodb不要设置密码访问++)
```javascript
https://www.mongodb.com/download-center#community
```

### 安装全局依赖
```javascript
npm install egg-scripts -g   // eggjs 脚本执行
npm install gulp -g  // 静态资源构建
npm install apidoc -g  // api文档生成
```


### 安装本系统依赖（代码根目录）
```javascript
npm install
```

### 安装插件缺少的依赖 
> 路径 lib/plugin/
```
cd lib/plugin/egg-dora-content
npm install
cd lib/plugin/egg-dora-maildelivery
npm install
```


### 初始化数据
```javascript
npm run init
```

> 网站图片资源可从这里获取
下载链接: https://pan.baidu.com/s/1th7Qlz4eJGNN3w_Tacl9AQ 提取码: jczt  ，解压后放到项目根目录下 app/public/upload (替换)。

### 开发模式启动
```javascript
npm install egg-scripts -g   // egg 启动工具
npm install gulp -g  // 静态资源构建
npm install apidoc -g  // 生成api文档
```


### 安装本系统依赖（代码根目录）
```javascript
npm install
```

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

api访问地址： http://localhost:8080/static/apidoc/index.html
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


