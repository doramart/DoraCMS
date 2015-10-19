
##问题：
- 1、redis connection to 127.0.0.1:6379 failed 这个是redis连接不上的问题，请看这篇文章[DoraCMS redis报错问题](http://www.html-js.cn/details/4yyl6O7A.html)
- 2、failed to load c++ bson extension 这个问题不用管,node自己的问题,不影响程序运行
- 3、今天正式去掉了node_modules，运行前需要在代码根目录下执行 npm install 来安装，不然会导致不同node或系统兼容性问题（感谢[@faceair](https://cnodejs.org/user/faceair)的建议）
- 4、testuser 用户只有后台查看的权限，作为前端博客还在维护，目的是让用户了解后台结构和相关功能，不允许普通用户有数据库相关操作，请知悉

###-------------------------------------------------------------------------------------------------
       
![DoraCMS](http://git.oschina.net/uploads/images/2015/0930/174726_d78c4a23_352304.jpeg "DoraCMS")
     
#DoraCMS
## DoraCMS是基于Nodejs+express+mongodb编写的一套内容管理系统，结构简单，较目前一些开源的cms，doracms易于拓展，特别适合前端开发工程师做二次开发。

### 代码演示1.[基于DoraCMS 定制的博客系统](http://www.html-js.cn) 管理地址：http://www.html-js.cn/admin  （账号:testuser,密码：doracms）
### 代码演示2.[基于 DoraCMS 定制的视频分享站点](http://www.dailyads.cn)

## 操作文档链接：
## http://www.html-js.cn/details/Ey20NbBi.html
## http://www.html-js.cn/details/VkldQTPs.html
## 开发文档链接：
## http://www.html-js.cn/details/VJpfeMYj.html(不断更新)
## 开发文档下载
## http://7xkr1n.com1.z0.glb.clouddn.com/@/cms/DoraCMS开发指南.doc
## 注意：开源后陆续发现了一些问题，我都提交了，今后也会持续补充，开发文档或遇到问题请直接参考我博客的文章(http://www.html-js.cn/details/VJpfeMYj.html),
## 或者在该版块下留言，这里会不断更新，因为精力有限并不保证word版开发指南会保持最新，

###-------------------------------------------------------------------------------------------------

###版本更新 2015年10月15日11:27:01
###版本号v1.0.5
###更新内容：

- 1、列表显示（热门新闻、tags、列表等）加入了记录为0的显示情况
- 2、后台登录加入了验证码功能
- 3、后台图片上传组件优化(传入上传文件类型参数)
- 4、后台添加文章默认去管理员姓名为author
- 5、修复了用户中心留言翻页的bug
- 6、对大部分前台传入后台的参数进行校验
- 7、缓存站点地图的路径问题
- 8、加入了静态资源版本戳
- 9、修复了一些小bug。


###-------------------------------------------------------------------------------------------------

###版本更新 2015年9月30日18:21:58
###版本号v1.0.4
###更新内容：

- 1、抽取出了后台的搜索模块
- 2、加入了批量删除功能
- 3、标签模块修复了搜索bug
- 4、修复前台icon图标不显示的问题
- 5、后台添加了登录日志管理
- 6、后台数据加载加入了loading
- 7、统一了后台数据显示表格样式
- 8、修复了时间格式化问题（上午和下午显示的小时数一致）
- 9、修复了管理首页留言记录样式问题
- 10、删除单条记录和批量删除提取为公共js
- 11、修复了一个兄弟提到的保存记录没有容错处理的问题
- 12、修复了一些小bug。

###-------------------------------------------------------------------------------------------------

###版本更新 2015年9月23日16:44:43
###版本号v1.0.3
###更新内容：

- 1、用户中心添加‘参与话题’模块
- 2、取消了后台鉴权的多层嵌套
- 3、增加了系统操作提示
- 4、完善了后台权限管理机制
- 5、抽取了后台公共弹窗提示和信息提示
- 6、抽取出后台公用js（ztree,uploadify,angularjs的get、post方法等）后台重复使用的方法，减少冗余代码
- 7、彻底去掉了邮件模板设置模块
- 8、重写了前台分页，去掉了最初的angularJS分页，使用原生js展现
- 9、修复了一个查询的bug
- 10、计划近期开放后台查看功能，敬请期待。

###-------------------------------------------------------------------------------------------------

###版本更新 2015年9月11日20:32:05
###版本号v1.0.2
###修复内容：
- 1、整理了相关方法类文件，归档到util下
- 2、站点地图自动生成，后面不用自己传了
- 3、加入了缓存机制，目前对用户登录加入了缓存控制，站点地图也缓存了
- 4、添加了用户找回密码的功能，这个功能DoraCMS以前去掉了，现在重新整理代码后加上
- 5、合代码的时候发现部分文件漏掉了，十分抱歉，这次补上，如果本地调试发现问题，可以随时issue me

###-------------------------------------------------------------------------------------------------


###版本更新 2015年9月5日22:16:46
###版本号v1.0.1
###修复内容：
- 1、整理了admin.js的部分代码，主要针对列表请求、增、删、改、查的优化，并减少了冗余代码
- 2、针对接口重新整理了后台界面的angularjs的调用
- 3、去掉了“文档属性管理” ，栏目，就目前看，这个栏目基本没用

### 后台的相关功能将继续完善，如果您有任何问题，请在issue中提出，我会尽快解答

###-------------------------------------------------------------------------------------------------

###版本更新 2015年8月30日18:39:01
###版本号v1.0.0
###修复内容：
- 1、重构了前端界面，模块化CMS基础部分
- 2、删掉了冗余的js和css，力求通过最简单的方式表达界面
- 3、前台尽量减少ajax请求
- 4、后台整理了返回数据的接口
- 5、干掉了七牛云存储和QQ登录等需要借助第三方才能正常使用的东东
- 6、恢复了原生态的注册、登录
- 7、源代码比以前减少30%
- 8、演示地址：http://www.html-js.cn

###参考了一些优秀的框架，个人有时候很避讳框架类型的东西，只有了解清楚本质在用才有意义，所以架构方面的框架先学习学习再说吧，暂时不引用到DoraCMS中
###接下来计划对后台代码进行整理

###注意：本次更新变化很大，如果您在之前基础上开发，请先备份。

###-------------------------------------------------------------------------------------------------

#DoraCMS开发指南
- 一、 DoraCMS 安装	2
- 1.1 安装nodejs	2
- 1.2 安装Mongodb。	2
- 1.3 运行DoraCMS	3
- 1.3.1启动mongodb	3
- 1.3.2 插入初始数据	4
- 1.3.3运行DoraCMS	5
- 1.3.4 访问地址	6
- 二、 DorCMS 开发	7
- 2.1 配置文件	7
- 2.2 关于路由	11
- 2.3 关于模板	11
- 2.4 实体类	13
- 2.5 用到的插件	15
- 2.6 关于编码	16
- 三、总结	16
- 四、FAQ	17


##一、DoraCMS 安装
### 1.1 安装nodejs
- DoraCMS 是基于Nodejs 开发的，所以要想正常运行DoraCMS 需要nodejs环境。在Nodejs官网(https://nodejs.org/) 根据电脑版本下载对应的安装文件进行安装，安装完成后，打开命令窗口执行 node -v，如果出现版本号，证明安装成功。我的电脑是64位版本，安装了重启之后才生效。


### 1.2 安装Mongodb。
- DoraCMS 使用的是Mongodb 的数据库，至于Mongodb 的特点和nosql的优势在此就不做详细描述了。安装方法很简单，到官网 (https://www.mongodb.org/) 下载对应版本，直接安装就可以了。这里有一点需要注意的是，如果你安装在D盘，安装完成后，在D盘根目录下创建文件夹 data ,不然启动mongo会提示数据库路径错误，当然你也可以通过命令启动mongodb来指定数据库的路径，如果你不想麻烦，就照我说的处理就可以了。

- 1、在本地盘建立一个文件夹（最好英文名称），通过svn checkout 出DoraCMS的代码，svn地址：svn://git.oschina.net/doramart/DoraCMS  

- 注：.idea 不属于项目文件夹，为webstorm 工程文件，不必理会。

- 1.3 运行DoraCMS
- 1.3.1启动mongodb
- 找到mongodb安装目录下bin文件夹，执行 mongod.exe



### 1.3.2 插入初始数据
- 在《DoraCMS操作指南》 中有提到插入初始管理数据，因为刚安装的数据是空的，需要插入初始数据来管理后台，这里重新介绍一次：
- ①、找到Mongodb安装目录(MongoDB\Server\3.0\bin) 执行 mongo.exe
- ②、输入 use doracms
- ③、插入用户组数据

```
db.admingroups.insert({
  "_id" : "4yTbsWiI",
  "name" : "超级管理员",
  "power" : "[\"sysTemManage:true\",\"sysTemManage_user:true\",\"sysTemManage_user_add:true\",\"sysTemManage_user_view:true\",\"sysTemManage_user_modify:true\",\"sysTemManage_user_del:true\",\"sysTemManage_uGroup:true\",\"sysTemManage_uGroup_add:true\",\"sysTemManage_uGroup_view:true\",\"sysTemManage_uGroup_modify:true\",\"sysTemManage_uGroup_del:true\",\"sysTemManage_ads:true\",\"sysTemManage_ads_add:true\",\"sysTemManage_ads_view:true\",\"sysTemManage_ads_modify:true\",\"sysTemManage_ads_del:true\",\"sysTemManage_files:true\",\"sysTemManage_files_view:true\",\"sysTemManage_data:true\",\"sysTemManage_data_1:true\",\"sysTemManage_data_1_view:true\",\"sysTemManage_data_1_backup:true\",\"sysTemManage_data_1_del:true\",\"contentManage:true\",\"contentManage_content:true\",\"contentManage_content_add:true\",\"contentManage_content_view:true\",\"contentManage_content_top:true\",\"contentManage_content_modify:true\",\"contentManage_content_del:true\",\"contentManage_cateGory:true\",\"contentManage_cateGory_add:true\",\"contentManage_cateGory_view:true\",\"contentManage_cateGory_modify:true\",\"contentManage_cateGory_del:true\",\"contentManage_tag:true\",\"contentManage_tag_add:true\",\"contentManage_tag_view:true\",\"contentManage_tag_modify:true\",\"contentManage_tag_del:true\",\"contentManage_temp:true\",\"contentManage_temp_add:true\",\"contentManage_temp_view:true\",\"contentManage_temp_modify:true\",\"contentManage_temp_del:true\",\"contentManage_msg:true\",\"contentManage_msg_view:true\",\"contentManage_msg_modify:true\",\"contentManage_msg_del:true\",\"userManage:true\",\"userManage_user:true\",\"userManage_user_view:true\",\"userManage_user_modify:true\",\"userManage_user_del:true\"]",
  "date" : ISODate("2015-06-30T08:04:46.092Z"),
  "__v" : 0
})

```

- ④、插入用户数据

```
db.adminusers.insert({
  "_id" : "E1jNjZi8",
  "name" : "test",
  "username" : "test",
  "password" : "14700a6f381897e0",
  "phoneNum" : 12358563215.0,
  "email" : "doramart@qq.com",
  "group" : "4yTbsWiI",
  "comments" : "doramart",
  "logo" : "/upload/images/defaultlogo.png",
  "date" : ISODate("2015-06-18T01:17:15.007Z"),
  "__v" : 0
})

```

- ⑤、插入数据如果存在格式问题，需要在记事本里编辑一下。如果上述执行正常，那么默认的登录名和密码为  test / doracms  ,这样，您就可以正常登录后台了。

### 1.3.3运行DoraCMS
- 在刚刚svn下载的代码目录下 调出cmd命令窗口，执行npm start 



- 如果没有报错，证明运行成功了。
- 注意：DoraCMS 指定了默认端口号为80，如果您的机器已经占用了80端口，这里会报错，如果想修改默认端口号，可以到代码的bin目录下 www 文件修改，当然修改完成，访问路径记得带上端口号：



- 至此，doraCMS就运行起来了


###  1.3.4 访问地址
前台：127.0.0.1 (默认80端口)
后台：127.0.0.1/admin


## 二、DorCMS 开发
###  2.1 配置文件
- DoraCMS 的主要配置在 settings.js 中设置（/onlineCMS/models/db/settings.js）

```
    COOKIE_SECRET: 'doramart.com',
    URL: 'mongodb://127.0.0.1:27017/doracms',
    DB: 'doracms',
    HOST: '127.0.0.1', // 数据库地址
    PORT: 27017, // 数据库端口号
    USERNAME: 'doracms', // 数据库用户名
    PASSWORD: '000000', // 数据库密码
    SITETITLE : '前端开发俱乐部', // 站点名称
    SITEDOMAIN : 'http://www.html-js.cn', // 站点域名
    SITEICP : '粤ICP备111111号-2', // 站点备案号
    SYSTEMMAIL : 'xxxx@163.com', //站点邮箱
    UPDATEFOLDER : process.cwd()+'/public/upload', // 默认上传文件夹本地路径
    TEMPSFOLDER : process.cwd()+'/views/web/temp', // 默认模板文件夹本地路径
    DATAOPERATION : process.cwd()+'/models/db/bat', //数据库操作脚本目录
    DATABACKFORDER : 'C:/softbak/xxxx/', // 服务端数据库操作脚本目录
    CMSDISCRIPTION : '前端开发俱乐部,分享前端知识,丰富前端技能。汇集国内专业的前端开发文档,为推动业内前端开发水平共同奋斗。html,js,css,nodejs,前端开发,jquery,web前端, web前端开发, 前端开发工程师',
    SITEKEYWORDS : '前端开发俱乐部,前端俱乐部,DoraCMS内容管理系统, 前端开发, web前端, web前端开发, 前端开发工程师, 设计, 开发, 前端资源, angularjs, JavaScript,js, Ajax, jQuery, html,html5,css3,浏览器兼容, 前端开发工具, nodejs , node , boostrap',
    SITEBASICKEYWORDS : '前端开发俱乐部,前端开发,前端俱乐部,DoraCMS', // 基础关键词
    STATICFILEPATH : '', // 静态文件空间地址
    UPDATEFILEPATH : '', // 上传文件空间地址
    QINIUACCESS_KEY : '',  // 七牛秘钥
    QINIUSECRET_KEY : '',  // 七牛秘钥
	QINIUCMSBUCKETNAME : '',  // 七牛Bucket_Name
```
- 针对上面这些静态参数都进行了详细的注释，如果你设置了数据库账号密码，则需要在这里做相应的配置，同时需要在 Dbopt.js 中做相应的数据库连接设置。


```
### Settings.js 中有四个参数需要注意一下：
- UPDATEFOLDER : process.cwd()+'/public/upload', // 默认上传文件夹本地路径
- TEMPSFOLDER : process.cwd()+'/views/web/temp', // 默认模板文件夹本地路径
- DATAOPERATION : process.cwd()+'/models/db/bat', //数据库操作脚本目录
```
### 上面三个参数原则上不用修改，UPDATEFOLDER 指定上传文件的目录，TEMPSFOLDER 为指定的模板文件夹，DATAOPERATION 为执行数据备份的脚本目录文件夹
```
- DATABACKFORDER : 'C:/softbak/xxxx/', // 服务端数据库操作脚本目录
- DATABACKFORDER 指定数据备份的本地路径。
```
- 下面的配置都是后台模块的静态参数：

```
SYSTEMMANAGE : 'sysTemManage_0',  // 后台模块(系统管理)
    ADMINUSERLIST : 'sysTemManage_0_1',
    ADMINGROUPLIST : 'sysTemManage_0_2',
    EMAILTEMPLIST : 'sysTemManage_0_3',
    ADSLIST : 'sysTemManage_0_4',
    FILESLIST : 'sysTemManage_0_5',
    DATAMANAGE : 'sysTemManage_0_6', // 数据管理
    BACKUPDATA : 'sysTemManage_0_6_1', // 数据备份


    CONTENTMANAGE : 'contentManage_1', // 后台模块(内容管理)
    CONTENTLIST : 'contentManage_1_1',
    CONTENTCATEGORYS : 'contentManage_1_2',
    CONTENTTAGS : 'contentManage_1_3', //标签管理
    CONTENTTEMPS : 'contentManage_1_4', //模板管理
    CONTENTTYPES : 'contentManage_1_5',  // 内容属性管理
    CONTENTFILMTYPES : 'contentManage_1_5_1',  // 内容属性管理
    CONTENTCOUNTRYTYPES : 'contentManage_1_5_2',  // 内容属性管理
    CONTENTYEARSTYPES : 'contentManage_1_5_3',  // 内容属性管理
    MESSAGEMANAGE : 'contentManage_1_6', // 留言管理

    USERMANAGE : 'userManage_2', // 后台模块(会员管理)
	REGUSERSLIST: 'userManage_2_1'
```
- 改参数对应后台模板文件 adminTemp.ejs 中的模块列表的：


- 也就是说，如果新增模块，需要在配置文件(settings.js) 和 adminTemp.ejs 中配置相应的cid。
- 这个属性是权限控制需要的，除此之外，加入新模块后，需要在权限管理模块加入新模块，并配置对应的cid


### 2.2 关于路由

- DoraCMS 中所有的请求都是通过nodejs的路由来处理的，原理类似于java中的 struts 。
路由文件在routes文件夹下

```
Admin.js , 后台所有模块管理路由
Content.js 前台文档相关
Index.js 首页相关（也包含文档列表和文档相亲）
System.js 系统操作的相关路由 （比如文件上传、邮件发送等）
Users.js 用户中心的相关请求走这里
Validat.js 后台权限控制（没有授予管理权限(session)会直接过滤掉请求）
```
### 2.3 关于模板
- DoraCMS 是基于ejs 模板引擎来表现前台页面的，选择ejs 是因为比jade更好理解一些。属性js的童鞋也好接受ejs的语法来展示数据。DoraCMS 的模板文件都在 views 文件夹下：



- 解析：
- 1、views 下的 index.ejs 为首页主体内容，sitemap.ejs 是站点地图的主体内容，sitemap.ejs是展示给用户看的，不需要手动更新。
- 2、Web 为前台的所有模板文件，web根目录下的 do404.ejs, do505.ejs , dosuccess.ejs 是处理操作过程结果反馈的模板，这些是普遍需要用到的。
- 3、Users 是用户相关页面模板。
- 4、Temp中包含了公共header和footer，以及文档模板，aboutMe、blog、lab 都属于文档模板，可以根据自己的需要自行添加。


- 5、public 文件夹中的模板暂时没用到。
- 6、Manage 里是后台的所有页面模板，adminTemp.ejs 是模板外壳，里面包含了各个模块列表和一些公共的引用。


- 7、public 文件夹下是公共目录，主要放置静态文件，包括前台和后台的静态js，css，以及DoraCMS 用到的jquery插件等。Public 下的文件都是公开的，在app.js 中设置。

### 2.4 实体类
- 这里称为“实体类”可能有些不妥，在java中，这部分确实就叫实体类，代表每个对象所具有的属性，文件存放于models 文件夹中。每个对象都有详细注释，开发者自己去查看就可以了。


### 2.5 用到的插件
- 开发过程中，很多功能并不是自己写的，用到了npm上比较优秀的一些插件，在此选出一些做介绍，所有插件在 node_modules 下



- 1、Express nodejs 框架，是DoraCMS的基础框架
- 2、Gm 图片缩略图，为上传图片生成指定大小的缩略图
- 3、Moment 时间格式化工具，功能非常强大
- 4、Nodemailer nodejs邮件发送组件
- 5、Formidable 文件上传组件
- 6、Qiniu 七牛云存储组件，用于将文件上传到七牛上
- 7、Qr-image 用户将自定义链接生成二维码图片的组件，轻量级 很方便
- 8、Archiver 文件夹压缩工具，将指定文件夹压缩为zip
- 9、Shortid 用在了实体类中，用于生成短id替代 mongodb 的长id
- 10、Validator 用户服务端数据校验，提供很多方法对数据进行校验
- 11、Ueditor-nodejs 将nodejs和百度的ueditor整合，这个组件感觉很有用
- 12、Mongoose 用于nodejs 连接 mongodb，并提供了丰富的数据处理的接口


### 2.6 关于编码
- 1、DoraCMS 的编码，前台主要用到了 ejs 模板和ejs语法 展示数据；后台主要用到了ejs和 angularjs 来展示数据。不熟悉 angularjs 的童鞋和简单了解一下，对于后台展示数据非常方便，但是不适合前台，因为angularjs 不适合做seo 。
- 2、DoraCMS 基于 nodejs + express 编写，所以前端基本是div+css+js ,服务端主要是js，对js比较了解的前端开发者很容易就能上手。
- 3、DoraCMS 80%的代码都有注释，详细介绍了接口的用途和细节处理，方便查看。



## 三、总结

- DoraCMS 开发时间比较短，功能并不是很丰富，但是麻雀虽小、五脏俱全，基本功能都是具备的。由于DoraCMS是本人独立开发，由于技术有限难免会有些处理不好的地方，或者一些很明显的bug（虽然我也在不断的改善），如果您发现了问题，请您不佞赐教，如果确实存在问题，我会不断的更新上去，这也是开源的目的之所在。如果您有更好的解决方案或者对DoraCMS有更好的想法，也可以通过我的博客联系我，让我们一起探讨，共同进步。


## 四、FAQ

### 1、一直没看到说设置数据库密码，这样安全么？
- 当然不安全，本地调试可以不用设置密码，程序部署上去肯定是要设置数据库账号密码的，怎样设置呢，给个链接大家可以参考下：
- http://ibruce.info/2015/03/03/mongodb3-auth/

### 2、网络上很多cms都很强大，为什么要选择DoraCMS ？
- 当然，目前很多成熟的cms（织梦、phpcms等），DoraCMS 刚起步自然比不了，首先DoraCMS创建的目的是为了更深入的了解nodejs并付诸实践，开源的目的也是为了通过案例来不断改进我们的nodejs水平，共同提高；其次DoraCMS结构清晰、模块简单，上手很容易。目前市面的cms结构复杂，想要自己修改定制学习成本比较高。初识nodejs的开发者可以了解一个cms实现的基础过程，熟悉nodejs的也可以用DoraCMS 来进行二次开发，不用再从头开始。DoraCMS 遵循MIT协议完全开源，您可以自由定制属于你自己的网站而不必花很多时间去处理最基础的一些东西，为了让更多的人去了解和认识nodejs，于是DoraCMS 诞生了。

### 3、演示地址在哪里?
 
### 代码演示1.[基于DoraCMS 定制的博客系统](http://www.html-js.cn) 
### 代码演示2.[基于 DoraCMS 定制的视频分享站点](http://www.dailyads.cn)

### 4、为什么上传图片失败？

- DoraCMS 默认在3个地方用到了上传：用户上传头像、添加文档主图、内容详情中文件、图片或附件上传。
- 其中用户上传头像、添加文档主图默认使用七牛，所以如果您没有配置七牛云存储开发者相关信息，就会上传失败，需要在 /models/db/setting.js 下进行配置:

- (七牛免费10G空间，注册账号就可以获取到相关信息了)。
- 当然，有的童鞋不想用七牛，想直接传到网站相关目录，也是可以的。DoraCMS 预留的有通过 uploadify 上传图片或文件，而且上传接口自带了图片缩略图截取功能。您可以通过查看 /public/javascripts/webapp.js 下的 initUploadLogoBtn 方法：

```
function initUploadLogoBtn($scope){
    $("#uploadify").uploadify({
        'swf': '/plugins/uploadify/uploadify.swf',
        'uploader': '/system/upload?type=images&key=userlogo',
        'buttonText': '选择图片',
        'height': 40,
        'width': 138,
        'fileTypeDesc': 'Image Files',
        'fileTypeExts': '*.gif; *.jpg; *.png',
        'auto': true,
        'multi': true,
        'onUploadSuccess' : function(file, data, response) {
                alert("上传成功");
            $scope.logoFormData.logo = data;
            $("#myImg").attr("src",data);
            $('#submitLogo').removeClass('disabled');
        },
        'onComplete': function(event, queueID, fileObj, response, data) {
           
            alert("文件:" + fileObj.name + " 上传成功！");
        },

        'onUploadError' : function(file, errorCode, errorMsg, errorString) {
            alert('The file ' + file.name + ' could not be uploaded: ' + errorString);
        },
        'onError': function(event, queueID, fileObj) {
            alert("文件:" + fileObj.name + " 上传失败！");
        }
    });
}
```
- 通过上面的初始化按钮方法，您可以找到后台上传接口和处理方式。这两种上传方式您可以自己选择。