const local: App.I18n.Schema = {
  system: {
    title: 'DoraCMS',
    updateTitle: '系统版本更新通知',
    updateContent: '检测到系统有新版本发布，是否立即刷新页面？',
    updateConfirm: '立即刷新',
    updateCancel: '稍后再说'
  },
  common: {
    action: '操作',
    add: '新增',
    addSuccess: '添加成功',
    backToHome: '返回首页',
    batchDelete: '批量删除',
    cancel: '取消',
    close: '关闭',
    check: '勾选',
    expandColumn: '展开列',
    columnSetting: '列设置',
    config: '配置',
    confirm: '确认',
    delete: '删除',
    deleteSuccess: '删除成功',
    confirmDelete: '确认删除吗？',
    edit: '编辑',
    warning: '警告',
    error: '错误',
    index: '序号',
    keywordSearch: '请输入关键词搜索',
    logout: '退出登录',
    logoutConfirm: '确认退出登录吗？',
    lookForward: '敬请期待',
    modify: '修改',
    modifySuccess: '修改成功',
    modifyError: '修改失败',
    submitError: '提交失败',
    noData: '无数据',
    operate: '操作',
    pleaseCheckValue: '请检查输入的值是否合法',
    refresh: '刷新',
    reset: '重置',
    search: '搜索',
    switch: '切换',
    tip: '提示',
    trigger: '触发',
    update: '更新',
    updateSuccess: '更新成功',
    operateSuccess: '操作成功',
    userCenter: '个人中心',
    uploadSuccess: '上传成功',
    uploadError: '上传失败',
    yesOrNo: {
      yes: '是',
      no: '否'
    },
    input: {
      placeholder: '请输入'
    },
    validation: {
      confirmPasswordRequired: '请输入确认密码',
      passwordNotMatch: '两次输入的密码不一致',
      phone: '请输入正确的手机号码',
      email: '请输入正确的邮箱地址'
    },
    searchPlaceholder: '请输入搜索关键词',
    required: '必填',
    name: '名称',
    description: '描述',
    createdAt: '创建时间',
    updatedAt: '更新时间',
    contentTag: '标签管理',
    upload: '上传',
    button: '按钮',
    browserNotSupport: '您的浏览器不支持Clipboard API',
    copySuccess: '复制成功：',
    pleaseInputContent: '请输入要复制的内容'
  },
  request: {
    logout: '请求失败后登出用户',
    logoutMsg: '用户状态失效，请重新登录',
    logoutWithModal: '请求失败后弹出模态框再登出用户',
    logoutWithModalMsg: '用户状态失效，请重新登录',
    refreshToken: '请求的token已过期，刷新token',
    tokenExpired: 'token已过期'
  },
  theme: {
    themeSchema: {
      title: '主题模式',
      light: '亮色模式',
      dark: '暗黑模式',
      auto: '跟随系统'
    },
    grayscale: '灰色模式',
    colourWeakness: '色弱模式',
    layoutMode: {
      title: '布局模式',
      vertical: '左侧菜单模式',
      'vertical-mix': '左侧菜单混合模式',
      horizontal: '顶部菜单模式',
      'horizontal-mix': '顶部菜单混合模式',
      reverseHorizontalMix: '一级菜单与子级菜单位置反转'
    },
    recommendColor: '应用推荐算法的颜色',
    recommendColorDesc: '推荐颜色的算法参照',
    themeColor: {
      title: '主题颜色',
      primary: '主色',
      info: '信息色',
      success: '成功色',
      warning: '警告色',
      error: '错误色',
      followPrimary: '跟随主色'
    },
    scrollMode: {
      title: '滚动模式',
      wrapper: '外层滚动',
      content: '主体滚动'
    },
    page: {
      animate: '页面切换动画',
      mode: {
        title: '页面切换动画类型',
        'fade-slide': '滑动',
        fade: '淡入淡出',
        'fade-bottom': '底部消退',
        'fade-scale': '缩放消退',
        'zoom-fade': '渐变',
        'zoom-out': '闪现',
        none: '无'
      }
    },
    fixedHeaderAndTab: '固定头部和标签栏',
    header: {
      height: '头部高度',
      breadcrumb: {
        visible: '显示面包屑',
        showIcon: '显示面包屑图标'
      },
      multilingual: {
        visible: '显示多语言按钮'
      }
    },
    tab: {
      visible: '显示标签栏',
      cache: '标签栏信息缓存',
      height: '标签栏高度',
      mode: {
        title: '标签栏风格',
        chrome: '谷歌风格',
        button: '按钮风格'
      }
    },
    sider: {
      inverted: '深色侧边栏',
      width: '侧边栏宽度',
      collapsedWidth: '侧边栏折叠宽度',
      mixWidth: '混合布局侧边栏宽度',
      mixCollapsedWidth: '混合布局侧边栏折叠宽度',
      mixChildMenuWidth: '混合布局子菜单宽度'
    },
    footer: {
      visible: '显示底部',
      fixed: '固定底部',
      height: '底部高度',
      right: '底部局右'
    },
    watermark: {
      visible: '显示全屏水印',
      text: '水印文本'
    },
    themeDrawerTitle: '主题配置',
    pageFunTitle: '页面功能',
    resetCacheStrategy: {
      title: '重置缓存策略',
      close: '关闭页面',
      refresh: '刷新页面'
    },
    configOperation: {
      copyConfig: '复制配置',
      copySuccessMsg: '复制成功，请替换 src/theme/settings.ts 中的变量 themeSettings',
      resetConfig: '重置配置',
      resetSuccessMsg: '重置成功'
    }
  },
  route: {
    login: '登录',
    403: '无权限',
    404: '页面不存在',
    500: '服务器错误',
    'iframe-page': '外链页面',
    home: '首页',
    document: '文档管理',
    document_content: '内容管理',
    document_project: '项目文档',
    'document_project-link': '项目文档(外链)',
    document_vue: 'Vue文档',
    document_vite: 'Vite文档',
    document_unocss: 'UnoCSS文档',
    document_naive: 'Naive UI文档',
    document_antd: 'Ant Design Vue文档',
    'document_element-plus': 'Element Plus文档',
    document_alova: 'Alova文档',
    'document_content-message': '留言管理',
    'remote-page': '远程组件',
    'remote-page_demo1': '远程组件Demo1',
    'remote-page_ai-model-manage': 'AI模型管理',
    'remote-page_ai-content-publish': 'AI内容发布',
    'user-center': '个人中心',
    about: '关于',
    function: '系统功能',
    alova: 'alova示例',
    alova_request: 'alova请求',
    alova_user: '用户列表',
    alova_scenes: '场景化请求',
    function_tab: '标签页',
    'function_multi-tab': '多标签页',
    'function_hide-child': '隐藏子菜单',
    'function_hide-child_one': '隐藏子菜单',
    'function_hide-child_two': '菜单二',
    'function_hide-child_three': '菜单三',
    function_request: '请求',
    'function_toggle-auth': '切换权限',
    'function_super-page': '超级管理员可见',
    manage: '系统管理',
    manage_user: '用户管理',
    manage_ads: '广告管理',
    'manage_user-detail': '用户详情',
    'document_content-tag': '文档标签',
    manage_role: '角色管理',
    manage_menu: '菜单管理',
    'multi-menu': '多级菜单',
    'multi-menu_first': '菜单一',
    'multi-menu_first_child': '菜单一子菜单',
    'multi-menu_second': '菜单二',
    'multi-menu_second_child': '菜单二子菜单',
    'multi-menu_second_child_home': '菜单二子菜单首页',
    exception: '异常页',
    exception_403: '403',
    exception_404: '404',
    exception_500: '500',
    plugin: '插件示例',
    plugin_copy: '剪贴板',
    plugin_charts: '图表',
    plugin_charts_echarts: 'ECharts',
    plugin_charts_antv: 'AntV',
    plugin_charts_vchart: 'VChart',
    plugin_editor: '编辑器',
    plugin_editor_markdown: 'MD 编辑器',
    plugin_icon: '图标',
    plugin_map: '地图',
    plugin_print: '打印',
    plugin_swiper: 'Swiper',
    plugin_video: '视频',
    plugin_barcode: '条形码',
    plugin_pinyin: '拼音',
    plugin_excel: 'Excel',
    plugin_pdf: 'PDF 预览',
    plugin_gantt: '甘特图',
    plugin_gantt_dhtmlx: 'dhtmlxGantt',
    plugin_gantt_vtable: 'VTableGantt',
    plugin_typeit: '打字机',
    plugin_tables: '表格',
    plugin_tables_vtable: 'VTable',
    'document_content-category': '内容分类',
    'manage_system-option-log': '系统操作日志',

    'manage_system-config': '系统配置',
    'manage_upload-file': '文件上传',
    member: '会员管理',
    'member_reg-user': '注册用户',
    email: '邮件管理',
    'email_mail-template': '邮件模板',
    extend: '扩展管理',
    'extend_template-config': '模板配置',
    extend_plugin: '插件管理'
  },
  page: {
    login: {
      common: {
        loginOrRegister: '登录/注册',
        userNamePlaceholder: '请输入用户名',
        phonePlaceholder: '请输入手机号',
        codePlaceholder: '请输入验证码',
        passwordPlaceholder: '请输入密码',
        confirmPasswordPlaceholder: '请确认密码',
        codeLogin: '验证码登录',
        confirm: '确认',
        back: '返回',
        validateSuccess: '验证成功',
        loginSuccess: '登录成功',
        welcomeBack: '欢迎回来，{userName} ！',
        imageCodePlaceholder: '请输入验证码',
        imageCode: '验证码',
        imageCodeRequired: '请输入验证码'
      },
      pwdLogin: {
        title: '密码登录',
        rememberMe: '记住我',
        forgetPassword: '忘记密码？',
        register: '注册账号',
        otherAccountLogin: '其他账号登录',
        otherLoginMode: '其他登录方式',
        superAdmin: '超级管理员',
        admin: '管理员',
        user: '普通用户'
      },
      initAdmin: {
        alertTitle: '系统初始化',
        alertDesc: '当前还没有管理员账号，请先创建一个管理员。',
        button: '创建管理员',
        title: '初始化管理员账号',
        description: '首次使用系统需要创建一个拥有全部权限的管理员账号。',
        form: {
          userName: '用户名',
          nickName: '昵称',
          email: '邮箱',
          phone: '手机号',
          password: '密码',
          confirmPassword: '确认密码',
          gender: '性别',
          genderMale: '男',
          genderFemale: '女'
        },
        success: '管理员创建成功，请使用该账号登录'
      },
      codeLogin: {
        title: '验证码登录',
        getCode: '获取验证码',
        reGetCode: '{time}秒后重新获取',
        sendCodeSuccess: '验证码发送成功',
        imageCodePlaceholder: '请输入图片验证码'
      },
      register: {
        title: '注册账号',
        agreement: '我已经仔细阅读并接受',
        protocol: '《用户协议》',
        policy: '《隐私权政策》'
      },
      resetPwd: {
        title: '重置密码'
      },
      bindWeChat: {
        title: '绑定微信'
      }
    },
    about: {
      title: '关于',
      introduction: `SoybeanAdmin 是一个优雅且功能强大的后台管理模板，基于最新的前端技术栈，包括 Vue3, Vite5, TypeScript, Pinia 和 UnoCSS。它内置了丰富的主题配置和组件，代码规范严谨，实现了自动化的文件路由系统。此外，它还采用了基于 ApiFox 的在线Mock数据方案。SoybeanAdmin 为您提供了一站式的后台管理解决方案，无需额外配置，开箱即用。同样是一个快速学习前沿技术的最佳实践。`,
      projectInfo: {
        title: '项目信息',
        version: '版本',
        latestBuildTime: '最新构建时间',
        githubLink: 'Github 地址',
        previewLink: '预览地址'
      },
      prdDep: '生产依赖',
      devDep: '开发依赖'
    },
    home: {
      branchDesc:
        '为了方便大家开发和更新合并，我们对main分支的代码进行了精简，只保留了首页菜单，其余内容已移至example分支进行维护。预览地址显示的内容即为example分支的内容。',
      greeting: {
        morning: '早安，{userName}, 今天又是充满活力的一天!',
        afternoon: '午安，{userName}, 下午的工作也要保持好状态哦!',
        evening: '晚上好，{userName}, 辛苦啦，今晚也要注意休息!',
        night: '夜深了，{userName}, 保持良好休息，为明天蓄力!'
      },
      weatherDesc: '今日多云转晴，20℃ - 25℃!',
      projectCount: '项目数',
      todo: '待办',
      message: '消息',
      downloadCount: '下载量',
      registerCount: '注册量',
      contentTotal: '内容总量',
      pendingContent: '待审核内容',
      pendingMessage: '待处理留言',
      todayNewContent: '今日新增内容',
      messageTotal: '留言总量',
      publishedContent: '已发布内容',
      draftContent: '草稿内容',
      contentPublish: '内容发布量',
      contentDistribution: '内容分布',
      headerDesc: '今日新增 {todayCount} 篇内容，{pendingContents} 篇内容待审核，{pendingMessages} 条留言需处理。',
      overviewLoadError: '加载工作台概览数据失败，请稍后重试',
      trendLoadError: '加载趋势数据失败',
      healthLoadError: '加载系统运行信息失败',
      schedule: '作息安排',
      study: '学习',
      work: '工作',
      rest: '休息',
      entertainment: '娱乐',
      visitCount: '访问量',
      turnover: '成交额',
      dealCount: '成交量',
      projectNews: {
        title: '项目动态',
        moreNews: '更多动态',
        desc1: 'DoraCMS 在2021年5月28日创建了开源项目 soybean-admin!',
        desc2: 'Yanbowe 向 soybean-admin 提交了一个bug，多标签栏不会自适应。',
        desc3: 'DoraCMS 准备为 soybean-admin 的发布做充分的准备工作!',
        desc4: 'DoraCMS 正在忙于为soybean-admin写项目说明文档！',
        desc5: 'DoraCMS 刚才把工作台页面随便写了一些，凑合能看了！'
      },
      creativity: '创意'
    },
    function: {
      tab: {
        tabOperate: {
          title: '标签页操作',
          addTab: '添加标签页',
          addTabDesc: '跳转到关于页面',
          closeTab: '关闭标签页',
          closeCurrentTab: '关闭当前标签页',
          closeAboutTab: '关闭"关于"标签页',
          addMultiTab: '添加多标签页',
          addMultiTabDesc1: '跳转到多标签页页面',
          addMultiTabDesc2: '跳转到多标签页页面(带有查询参数)'
        },
        tabTitle: {
          title: '标签页标题',
          changeTitle: '修改标题',
          change: '修改',
          resetTitle: '重置标题',
          reset: '重置'
        }
      },
      multiTab: {
        routeParam: '路由参数',
        backTab: '返回 function_tab'
      },
      toggleAuth: {
        toggleAccount: '切换账号',
        authHook: '权限钩子函数 `hasAuth`',
        superAdminVisible: '超级管理员可见',
        adminVisible: '管理员可见',
        adminOrUserVisible: '管理员和用户可见'
      },
      request: {
        repeatedErrorOccurOnce: '重复请求错误只出现一次',
        repeatedError: '重复请求错误',
        repeatedErrorMsg1: '自定义请求错误 1',
        repeatedErrorMsg2: '自定义请求错误 2'
      }
    },
    alova: {
      scenes: {
        captchaSend: '发送验证码',
        autoRequest: '自动请求',
        visibilityRequestTips: '浏览器窗口切换自动请求数据',
        pollingRequestTips: '每3秒自动请求一次',
        networkRequestTips: '网络重连后自动请求',
        refreshTime: '更新时间',
        startRequest: '开始请求',
        stopRequest: '停止请求',
        requestCrossComponent: '跨组件触发请求',
        triggerAllRequest: '手动触发所有自动请求'
      }
    },
    manage: {
      common: {
        status: {
          enable: '启用',
          disable: '禁用'
        }
      },
      role: {
        title: '角色列表',
        roleName: '角色名称',
        roleCode: '角色编码',
        roleStatus: '角色状态',
        roleDesc: '角色描述',
        menuAuth: '菜单权限',
        buttonAuth: '按钮权限',
        form: {
          roleName: '请输入角色名称',
          roleCode: '请输入角色编码',
          roleStatus: '请选择角色状态',
          roleDesc: '请输入角色描述'
        },
        addRole: '新增角色',
        editRole: '编辑角色'
      },
      user: {
        title: '用户列表',
        userName: '用户名',
        userGender: '性别',
        nickName: '昵称',
        userPhone: '手机号',
        userEmail: '邮箱',
        userStatus: '用户状态',
        userRole: '用户角色',
        userAvatar: '用户头像',
        password: '密码',
        confirmPassword: '确认密码',
        uploadSuccess: '上传成功',
        uploadFailed: '上传失败',
        imageTypeError: '上传头像图片只能是 JPG/PNG/GIF/WEBP 格式!',
        imageSizeError: '上传头像图片大小不能超过 2MB!',
        form: {
          userName: '请输入用户名',
          userGender: '请选择性别',
          nickName: '请输入昵称',
          userPhone: '请输入手机号',
          userEmail: '请输入邮箱',
          userStatus: '请选择用户状态',
          userRole: '请选择用户角色',
          userAvatar: '请上传用户头像',
          password: '请输入密码',
          confirmPassword: '请确认密码'
        },
        addUser: '新增用户',
        editUser: '编辑用户',
        gender: {
          male: '男',
          female: '女'
        }
      },
      menu: {
        home: '首页',
        title: '菜单列表',
        id: 'ID',
        parentId: '父级菜单ID',
        menuType: '菜单类型',
        menuName: '菜单名称',
        routeName: '路由名称',
        routePath: '路由路径',
        pathParam: '路径参数',
        layout: '布局',
        page: '页面组件',
        i18nKey: '国际化key',
        icon: '图标',
        localIcon: '本地图标',
        iconTypeTitle: '图标类型',
        order: '排序',
        constant: '常量路由',
        keepAlive: '缓存路由',
        href: '外链',
        hideInMenu: '隐藏菜单',
        activeMenu: '高亮的菜单',
        multiTab: '支持多页签',
        fixedIndexInTab: '固定在页签中的序号',
        query: '路由参数',
        button: '按钮',
        buttonDesc: '按钮描述',
        buttonPermissionCode: '权限标识',
        buttonHttpMethod: '请求方法',
        menuStatus: '菜单状态',
        form: {
          home: '请选择首页',
          menuType: '请选择菜单类型',
          menuName: '请输入菜单名称',
          routeName: '请输入路由名称',
          routePath: '请输入路由路径',
          pathParam: '请输入路径参数',
          page: '请选择页面组件',
          layout: '请选择布局组件',
          i18nKey: '请输入国际化key',
          icon: '请输入图标',
          localIcon: '请选择本地图标',
          order: '请输入排序',
          keepAlive: '请选择是否缓存路由',
          href: '请输入外链',
          hideInMenu: '请选择是否隐藏菜单',
          activeMenu: '请选择高亮的菜单的路由名称',
          multiTab: '请选择是否支持多标签',
          fixedInTab: '请选择是否固定在页签中',
          fixedIndexInTab: '请输入固定在页签中的序号',
          queryKey: '请输入路由参数Key',
          queryValue: '请输入路由参数Value',
          button: '请选择是否按钮',
          buttonDesc: '请输入按钮描述',
          buttonApi: '请输入按钮接口',
           buttonPermissionCode: '请输入权限标识',
           buttonHttpMethod: '请选择请求方法',
          menuStatus: '请选择菜单状态',
          buttonPermissionCodeDuplicate: '权限标识不能重复'
        },
        security: {
          apiFormatTip: 'API格式：模块/操作，如 user/getList。仅允许字母数字，不含特殊字符',
          apiValidation: {
            formatError: 'API格式不正确，应为 "模块/操作" 格式',
            tooLong: 'API路径过长，不能超过100个字符',
            dangerousChars: 'API包含危险字符，不允许使用 < > " \' & 空格 .. // 等字符',
            operationFormatError: '操作名格式不正确，只能包含字母和数字，且以字母开头',
            dangerousOperation: '操作名被禁止使用，存在安全风险',
            operationTooLong: '操作名过长，不能超过50个字符'
          },
          configErrors: 'API配置错误'
        },
        addMenu: '新增菜单',
        editMenu: '编辑菜单',
        addChildMenu: '新增子菜单',
        type: {
          directory: '目录',
          menu: '菜单'
        },
        iconType: {
          iconify: 'iconify图标',
          local: '本地图标'
        }
      },
      systemOptionLog: {
        title: '系统操作日志',
        type: '日志类型',
        logs: '日志内容',
        module: '所属模块',
        action: '操作动作',
        user_name: '操作用户',
        user_type: '用户类型',
        ip_address: 'IP地址',
        request_path: '请求路径',
        request_method: '请求方法',
        response_status: '响应状态',
        response_time: '响应时间',
        severity: '严重程度',
        environment: '运行环境',
        resource_type: '资源类型',
        resource_id: '资源ID',
        createdAt: '创建时间',
        clearAll: '清空所有日志',
        viewDetail: '查看详情',
        logDetail: '日志详情',
        basicInfo: '基本信息',
        requestInfo: '请求信息',
        responseInfo: '响应信息',
        userInfo: '用户信息',
        operationInfo: '操作信息',
        errorInfo: '错误信息',
        additionalInfo: '附加信息',
        old_value: '旧值',
        new_value: '新值',
        error_message: '错误信息',
        error_code: '错误代码',
        error_stack: '错误堆栈',
        trace_id: '追踪ID',
        session_id: '会话ID',
        user_agent: '用户代理',
        client_platform: '客户端平台',
        client_version: '客户端版本',
        request_params: '请求参数',
        request_body: '请求体',
        request_query: '查询参数',
        response_size: '响应大小',
        is_handled: '已处理',
        tags: '标签',
        extra_data: '额外数据',
        typeOptions: {
          login: '登录',
          logout: '登出',
          exception: '异常',
          operation: '操作',
          access: '访问',
          error: '错误',
          warning: '警告',
          info: '信息',
          debug: '调试'
        },
        userTypeOptions: {
          admin: '管理员',
          user: '用户',
          guest: '访客',
          system: '系统'
        },
        severityOptions: {
          low: '低',
          medium: '中',
          high: '高',
          critical: '严重'
        },
        environmentOptions: {
          local: '本地',
          development: '开发',
          staging: '预发布',
          production: '生产'
        },
        form: {
          type: '请选择日志类型',
          module: '请输入模块名称',
          action: '请输入操作动作',
          user_name: '请输入用户名',
          user_type: '请选择用户类型',
          severity: '请选择严重程度',
          environment: '请选择运行环境',
          ip_address: '请输入IP地址',
          start_date: '请选择开始日期',
          end_date: '请选择结束日期',
          keyword: '请输入关键词搜索'
        },
        startDate: '开始日期',
        endDate: '结束日期',
        dateRange: '时间范围',
        keyword: '关键词',
        stats: {
          title: '日志统计',
          total: '总日志数',
          today: '今日日志',
          byType: '按类型',
          bySeverity: '按严重程度',
          byModule: '按模块'
        },
        export: '导出日志',
        exportSuccess: '导出成功',
        exportFailed: '导出失败'
      },

      systemConfig: {
        title: '系统配置',
        key: '配置键',
        value: '配置值',
        type: '类型',
        public: '是否公开',
        addConfig: '添加配置',
        editConfig: '编辑配置',
        form: {
          key: '请输入配置键',
          value: '请输入配置值',
          type: '请选择配置类型',
          public: '请选择是否公开'
        }
      },
      uploadFile: {
        title: '上传配置',
        type: '上传类型',
        local: '本地',
        qiniu: '七牛云',
        aliyun: '阿里云OSS',
        uploadPath: '上传路径',
        qn_bucket: '存储空间',
        qn_accessKey: '访问密钥',
        qn_secretKey: '秘密密钥',
        qn_zone: '存储区域',
        qn_endPoint: '访问域名',
        oss_bucket: '存储空间',
        oss_accessKey: '访问密钥',
        oss_secretKey: '秘密密钥',
        oss_region: '地域',
        oss_endPoint: '访问域名',
        oss_apiVersion: 'API版本',
        form: {
          uploadPath: '请输入上传路径',
          qn_bucket: '请输入存储空间名称',
          qn_accessKey: '请输入访问密钥',
          qn_secretKey: '请输入秘密密钥',
          qn_zone: '请输入存储区域',
          qn_endPoint: '请输入访问域名',
          oss_bucket: '请输入存储空间名称',
          oss_accessKey: '请输入访问密钥',
          oss_secretKey: '请输入秘密密钥',
          oss_region: '请输入地域',
          oss_endPoint: '请输入访问域名',
          oss_apiVersion: '请输入API版本'
        }
      }
    },
    document: {
      ads: {
        title: '广告管理',
        name: '广告名称',
        type: '广告类型',
        type_image: '图片',
        type_text: '文字',
        state: '状态',
        carousel: '轮播',
        height: '高度',
        comments: '描述',
        items: '广告项',
        item: '广告项',
        link: '链接',
        alt: '替代文本',
        target: '打开方式',
        image: '图片',
        copyCode: '复制代码',
        typeOptions: {
          image: '图片',
          text: '文字'
        }
      },
      contentCategory: {
        title: '文档分类',
        add: '新增分类',
        addSub: '新增子分类',
        edit: '编辑分类',
        name: '分类名称',
        parentName: '上级分类',
        enable: '是否启用',
        type: '分类类型',
        typeNormal: '普通',
        typeSinger: '单页',
        icon: '分类图标',
        cover: '分类封面',
        template: '分类模板',
        seoUrl: 'SEO URL',
        sort: '排序',
        keywords: '关键词',
        description: '描述',
        nameRequired: '分类名称不能为空',
        nameLength: '分类名称长度不能超过20个字符',
        seoUrlRequired: 'SEO URL不能为空',
        descriptionRequired: '描述不能为空',
        descriptionLength: '描述长度不能超过200个字符',
        imageTypeError: '图片类型错误',
        imageSizeError: '图片大小不能超过2MB',
        form: {
          icon: '请输入图标名称'
        }
      },
      content: {
        title: '内容管理',
        mainTitle: '标题',
        subTitle: '副标题',
        category: '分类',
        tags: '标签',
        type: '类型',
        author: '作者',
        publishDate: '发布日期',
        state: '状态',
        draft: '草稿',
        pendingReview: '待审核',
        approved: '审核通过',
        offline: '未通过',
        addContent: '新增内容',
        editContent: '编辑内容',
        batchChangeCategory: '批量修改分类',
        selectCover: '选择封面',
        recyclebin: '回收站',
        clickNum: '点击量',
        commentNum: '评论量',
        selectContentFirst: '请先选择内容',
        selectCoverFirst: '请先选择封面',
        selectCategory: '选择分类',
        selectedContent: '您当前选择了',
        items: '篇文章',
        keywords: '关键词',
        coverImage: '封面图片',
        uploadCover: '上传封面',
        description: '摘要',
        content: '内容',
        comments: '备注',
        source: '来源',
        isTop: '推荐',
        isPinned: '置顶',
        isPublished: '发布',
        hideForm: '隐藏表单',
        batchRestore: '批量恢复',
        restore: '恢复',
        confirmRestore: '确认恢复该内容?',
        operateSuccess: '操作成功',
        form: {
          imageFormatError: '只能上传 jpeg、jpg、png、gif 格式的图片',
          imageSizeError: '图片大小不能超过 2MB',
          contentPlaceholder: '请输入内容...',
          keywordsSeparator: '多个关键词用英文逗号分隔'
        }
      },
      contentMessage: {
        title: '留言管理',
        userSaid: '用户留言',
        content: '留言内容',
        author: '留言者',
        replyAuthor: '回复对象',
        auditStatus: '审核状态',
        praiseNum: '点赞数',
        despiseNum: '踩数',
        createdAt: '留言时间',
        form: {
          searchContent: '请输入留言内容',
          selectAuditStatus: '请选择审核状态'
        },
        reply: '回复留言',
        replyUser: '回复用户留言',
        stitle: '文章标题',
        auditStatusOptions: {
          pending: '待审核',
          approved: '已通过',
          rejected: '已拒绝'
        }
      }
    },
    member: {
      regUser: {
        title: '注册用户',
        userName: '用户名',
        phone: '电话',
        email: '邮箱',
        role: '角色',
        status: '状态',
        registerTime: '注册时间',
        comments: '备注',
        editUser: '编辑用户',
        normalUser: '普通用户',
        adminUser: '管理员'
      }
    },
    email: {
      mailTemplate: {
        title: '邮件模板管理',
        type: '类型',
        comment: '备注',
        templateTitle: '标题',
        subTitle: '副标题',
        content: '内容',
        createdAt: '创建时间',
        tags: '模板标签',
        form: {
          type: '请选择模板类型',
          comment: '请输入模板备注',
          title: '请输入模板标题',
          subTitle: '请输入模板副标题',
          content: '请输入模板内容'
        },
        addTemplate: '添加模板',
        editTemplate: '编辑模板',
        commonTags: '通用标签',
        passwordRecoveryTags: '找回密码标签',
        messageTags: '留言通知标签',
        verificationTags: '邮箱验证码标签',
        tag: {
          siteName: '[站点名称]siteName',
          siteDomain: '[站点域名]siteDomain',
          email: '[用户邮箱]email',
          passwordToken: '[找回密码的token]token',
          messageAuthor: '[留言作者]message_author_userName',
          messageSendDate: '[创建留言时间]message_sendDate',
          messageContentTitle: '[留言关联文档标题]message_content_title',
          messageContentId: '[留言关联文档ID]message_content_id',
          verificationCode: '[邮件验证码]msgCode'
        }
      },
    },
    extend: {
      templateConfig: {
        title: '模板配置',
        templateMarket: '模板市场',
        installedTemplates: '已安装模板列表',
        uploadTemplate: '手动上传模板',
        author: '作者',
        version: '适用版本',
        introduction: '介绍',
        price: '价格',
        free: '免费',
        action: '操作',
        install: '安装',
        preview: '预览',
        enable: '启用',
        uninstall: '卸载',
        update: '更新',
        currentTheme: '当前主题',
        systemTemplate: '系统模板',
        templateConfig: '模板配置',
        addTemplateItem: '添加模板单元',
        form: {
          name: '名称',
          alias: '别名',
          template: '模板',
          comments: '备注',
          installSuccessMsg: '模板安装成功',
          uninstallSuccessMsg: '模板卸载成功',
          enableSuccessMsg: '模板启用成功',
          updateSuccessMsg: '模板更新成功',
          uploadSuccessMsg: '模板上传成功',
          uploadFailMsg: '模板上传失败',
          limitFileType: '只能上传zip文件',
          limitFileSize: '文件大小不能超过10M',
          operationInProgress: '操作正在进行中，请稍候...',
          installInProgress: '模板安装中，请稍候...',
          updateInProgress: '模板更新中，请稍候...',
          enableInProgress: '模板启用中，请稍候...',
        uninstallInProgress: '模板卸载中，请稍候...',
        processing: '处理中...'
      },
      downloadExample: '下载模板示例',
      paymentTitle: '支付宝扫码支付',
      selectTemplate: '请选择模板',
      templateItems: '模板单元'
    },
      plugin: {
        title: '插件管理',
        installedTitle: '已安装插件',
        shopTitle: '插件市场',
        name: '名称',
        description: '描述',
        version: '版本',
        hooks: '钩子',
        amount: '价格',
        state: '状态',
        install: '安装',
        uninstall: '卸载',
        update: '升级',
        installed: '已安装',
        notInstalled: '未安装',
        enable: '启用',
        createdAt: '创建时间',
        updatedAt: '更新时间',
        free: '免费',
        installNotice: '您确定要安装此插件吗？',
        uninstallNotice: '您确定要卸载此插件吗？',
        updateNotice: '您确定要更新此插件吗？',
        buyConfirm: '您确认要购买吗？',
        scanToPay: '扫码支付',
        pluginDetail: '插件详情',
        form: {
          name: '请输入插件名称',
          description: '请输入插件描述'
        }
      }
    }
  },
  form: {
    required: '不能为空',
    userName: {
      required: '请输入用户名',
      invalid: '用户名格式不正确'
    },
    phone: {
      required: '请输入手机号',
      invalid: '手机号格式不正确'
    },
    pwd: {
      required: '请输入密码',
      invalid: '密码格式不正确，6-18位字符，包含字母、数字、下划线'
    },
    confirmPwd: {
      required: '请输入确认密码',
      invalid: '两次输入密码不一致'
    },
    code: {
      required: '请输入验证码',
      invalid: '验证码格式不正确'
    },
    email: {
      required: '请输入邮箱',
      invalid: '邮箱格式不正确'
    }
  },
  dropdown: {
    closeCurrent: '关闭',
    closeOther: '关闭其它',
    closeLeft: '关闭左侧',
    closeRight: '关闭右侧',
    closeAll: '关闭所有'
  },
  icon: {
    themeConfig: '主题配置',
    themeSchema: '主题模式',
    lang: '切换语言',
    fullscreen: '全屏',
    fullscreenExit: '退出全屏',
    reload: '刷新页面',
    collapse: '折叠菜单',
    expand: '展开菜单',
    pin: '固定',
    unpin: '取消固定',
    searchIcon: '搜索图标',
    clickToSelectIcon: '点击选择图标',
    noResultFound: '你什么也找不到'
  },
  datatable: {
    itemCount: '共 {total} 条'
  },
  component: {
    iconSelect: {
      searchPlaceholder: '搜索图标',
      selectPlaceholder: '点击选择图标',
      noResult: '你什么也找不到'
    },
    coverSelect: {
      searchPlaceholder: '搜索封面',
      selectTypePlaceholder: '选择类型',
      nameLabel: '名称',
      typeLabel: '类型',
      previewLabel: '预览',
      operateLabel: '操作',
      noImage: '无图片',
      selected: '已选择',
      select: '选择'
    }
  }
};

export default local;
