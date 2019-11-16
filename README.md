# DoraCMS 2.1.4

![DoraCMS](https://raw.githubusercontent.com/doramart/picGo/master/img/Snipaste_2019-11-16_00-14-09.png "DoraCMS")

## 2.1.4 版本更新

1、使用eggjs重构了服务端

2、使用single-spa,vue-cli 重构了后台页面

3、完善了模板模块也修复了一些已知bug



## 说明

### DoraCMS 2.1.4 使用的技术栈：

```
1、nodejs 12.13.0 + eggjs 2
2、vue-cli
3、mongodb 4+
```

演示地址： [前端开发俱乐部](https://www.html-js.cn)  

后台登录： https://www.html-js.cn/dr-admin  
测试账号：doracms/123456  



## 开发环境准备工作:

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

## 捐赠
如果你发现DoraCMS很有用，可以请生哥喝杯咖啡(⊙o⊙)哦
<img width="650" src="http://cdn.html-js.cn/payme.jpg" alt="">

# LICENSE

MIT


