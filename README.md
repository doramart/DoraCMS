
##问题：
- 1、redis connection to 127.0.0.1:6379 failed 这个是redis连接不上的问题，请看这篇文章[DoraCMS redis报错问题](http://www.html-js.cn/details/4yyl6O7A.html)
- 2、failed to load c++ bson extension 这个问题不用管,node自己的问题,不影响程序运行
- 3、今天正式去掉了node_modules，运行前需要在代码根目录下执行 npm install 来安装，不然会导致不同node或系统兼容性问题（感谢[@faceair](https://cnodejs.org/user/faceair)的建议）
- 4、testuser 用户只有后台查看的权限，作为前端博客还在维护，目的是让用户了解后台结构和相关功能，不允许普通用户有数据库相关操作，请知悉
- 5、后台数据初始化的方式已变更，不用那么麻烦了，具体参考[DoraCMSV1.0.7升级指南](http://www.html-js.cn/details/VymuSlpGg.html)
###-------------------------------------------------------------------------------
       
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

## 注意：开源后陆续发现了一些问题，我都提交了，今后也会持续补充，开发文档或遇到问题请直接参考我博客的文章(http://www.html-js.cn/details/VJpfeMYj.html),
## 或者在该版块下留言，这里会不断更新，因为精力有限并不保证word版开发指南会保持最新，



###版本更新 2016年1月4日15:56:41
###版本号v1.1.0
###更新内容：

- 1、优化后台分页
- 2、添加了模板编辑功能
- 3、根据@chinakids的建议优化了后台左侧菜单回选代码
- 4、优化后台首页显示，{{}}改成ng-bind避免未及时加载而出现的大括号
- 5、下拉菜单样式的统一
- 6、新增了添加本地模板的功能
- 7、优化了图片上传和文件上传，图片上传可以设置默认不压缩
- 8、优化了文件真实类型校验
- 9、修复了用户注册校验的bug
- 10、修复了扩展路由访问不到页面的bug
- 11、修复了添加或删除模板单元的缓存问题
- 12、优化了uploadify组件
- 13、优化了搜索结果关键字高亮
- 14、增加了一个系统模板doraGallery
- 15、修复了一些明显的bug


###-------------------------------------------------------------------------------

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
- 找到routes下的validat.js文件,注释下面的代码
- ![qq 20151112111825](https://cloud.githubusercontent.com/assets/11911066/11110215/1c22e118-8934-11e5-8cbf-afcf6dab5d52.jpg)
- 找到/models/db 下的 adminFunc.js ，注释下面的一段，直接返回true
- ![qq 20151112111915](https://cloud.githubusercontent.com/assets/11911066/11110264/91f7dcf4-8934-11e5-8ac8-a463c12450ff.jpg)

至此，访问后台页面就不需要登录了，开启服务后，你可以直接访问地址：
管理员添加 ： http://127.0.0.1:81/admin/manage/adminUsersList
用户组管理 ：http://127.0.0.1:81/admin/manage/adminGroupList
注意：先添加用户组，在添加管理员，完成上面的操作，把代码还原回去，并重启服务。用刚才设置的管理员信息登录后台。

### 1.3.3运行DoraCMS
- 在刚刚svn下载的代码目录下 调出cmd命令窗口，执行npm start 



- 如果没有报错，证明运行成功了。
- 注意：DoraCMS 指定了默认端口号为80，如果您的机器已经占用了80端口，这里会报错，如果想修改默认端口号，可以到代码的bin目录下 www 文件修改，当然修改完成，访问路径记得带上端口号：



- 至此，doraCMS就运行起来了
###  1.3.4 进入后台，找到模板配置模块。切换到安装主题选项卡，点击安装。

###  1.3.5 安装成功后会在可用主题中找到刚安装的主题,在可用主题中点击“启用”，即可激活改主题：

###  1.3.6 访问地址
前台：127.0.0.1 (默认81端口)
后台：127.0.0.1/admin


## 二、DorCMS 开发
###  2.1 配置文件
- DoraCMS 的主要配置在 settings.js 中设置（/onlineCMS/models/db/settings.js）

```
    SITETITLE : '前端开发俱乐部', // 站点名称
    SITEDOMAIN : 'http://www.html-js.cn', // 站点域名
    SITEICP : '粤ICP备15038960号-2', // 站点备案号
    SITEVERSION : 'd20151012142453', // 静态资源版本戳
    SYSTEMMAIL : 'doramart@qq.com', // 管理员个人邮箱
    UPDATEFOLDER : process.cwd()+'/public/upload', // 默认上传文件夹本地路径
    TEMPSFOLDER : process.cwd()+'/views/web/temp', // 默认模板文件夹本地路径
    DATAOPERATION : process.cwd()+'/models/db/bat', //数据库操作脚本目录
    DATABACKFORDER : 'C:/softbak/mongodbConfig/mongodata/', // 服务端数据库操作脚本目录
    CMSDISCRIPTION : '前端开发俱乐部,分享前端知识,丰富前端技能。汇集国内专业的前端开发文档,为推动业内前端开发水平共同奋斗。html,js,css,nodejs,前端开发,jquery,web前端, web前端开发, 前端开发工程师',
    SITEKEYWORDS : '前端开发俱乐部,前端俱乐部,DoraCMS,内容管理系统, 前端开发, web前端, 前端开发工程师,前端资源, angularjs, 前端开发工具, nodejs ,boostrap',
    SITEBASICKEYWORDS : '前端开发俱乐部,前端开发,前端俱乐部,DoraCMS', // 基础关键词
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
	SYSTEMMANAGE : new Array('sysTemManage','DoraCMS后台管理'),  // 后台模块(系统管理)
    ADMINUSERLIST : new Array('sysTemManage_user','系统用户管理'),
    ADMINGROUPLIST : new Array('sysTemManage_uGroup','系统用户组管理'),
    ADSLIST : new Array('sysTemManage_ads','广告管理'),
    FILESLIST : new Array('sysTemManage_files','文件管理'),
    DATAMANAGE : new Array('sysTemManage_data','数据管理'), // 数据管理
    BACKUPDATA : new Array('sysTemManage_data_1','数据备份'), // 数据备份
    SYSTEMLOGS : new Array('sysTemManage_logs','操作日志'), // 系统操作日志


    CONTENTMANAGE : new Array('contentManage','内容管理'), // 后台模块(内容管理)
    CONTENTLIST : new Array('contentManage_content','文档管理'),
    CONTENTCATEGORYS : new Array('contentManage_cateGory','文档类别管理'),
    CONTENTTAGS : new Array('contentManage_tag','文档标签管理'), //标签管理
    CONTENTTEMPS : new Array('contentManage_temp','文档模板管理'), //模板管理
    MESSAGEMANAGE : new Array('contentManage_msg','留言管理'), // 留言管理

    USERMANAGE : new Array('userManage','会员管理'), // 后台模块(会员管理)
    REGUSERSLIST: new Array('userManage_user','注册用户管理')
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