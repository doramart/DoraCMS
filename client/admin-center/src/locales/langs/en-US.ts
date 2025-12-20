const local: App.I18n.Schema = {
  system: {
    title: 'DoraCMS',
    updateTitle: 'System Version Update Notification',
    updateContent: 'A new version of the system has been detected. Do you want to refresh the page immediately?',
    updateConfirm: 'Refresh immediately',
    updateCancel: 'Later'
  },
  common: {
    action: 'Action',
    add: 'Add',
    addSuccess: 'Add Success',
    backToHome: 'Back to home',
    batchDelete: 'Batch Delete',
    cancel: 'Cancel',
    close: 'Close',
    check: 'Check',
    expandColumn: 'Expand Column',
    columnSetting: 'Column Setting',
    config: 'Config',
    confirm: 'Confirm',
    delete: 'Delete',
    deleteSuccess: 'Delete Success',
    confirmDelete: 'Are you sure you want to delete?',
    edit: 'Edit',
    warning: 'Warning',
    error: 'Error',
    index: 'Index',
    keywordSearch: 'Please enter keyword',
    logout: 'Logout',
    logoutConfirm: 'Are you sure you want to log out?',
    lookForward: 'Coming soon',
    modify: 'Modify',
    modifySuccess: 'Modify Success',
    submitError: 'Submit failed',
    modifyError: 'Modify failed',
    noData: 'No Data',
    operate: 'Operate',
    pleaseCheckValue: 'Please check whether the value is valid',
    refresh: 'Refresh',
    reset: 'Reset',
    search: 'Search',
    switch: 'Switch',
    tip: 'Tip',
    trigger: 'Trigger',
    update: 'Update',
    updateSuccess: 'Update Success',
    operateSuccess: 'Operate Success',
    userCenter: 'User Center',
    uploadSuccess: 'Upload Success',
    uploadError: 'Upload Failed',
    yesOrNo: {
      yes: 'Yes',
      no: 'No'
    },
    input: {
      placeholder: 'Please enter'
    },
    validation: {
      confirmPasswordRequired: 'Please enter confirm password',
      passwordNotMatch: 'The two passwords do not match',
      phone: 'Please enter a valid phone number',
      email: 'Please enter a valid email address'
    },
    searchPlaceholder: 'Please enter search keyword',
    name: 'Name',
    description: 'Description',
    createdAt: 'Create Time',
    updatedAt: 'Update Time',
    required: 'Required',
    contentTag: 'Content Tag Management',
    upload: 'Upload',
    button: 'Button',
    browserNotSupport: 'Your browser does not support Clipboard API',
    copySuccess: 'Copy Success: ',
    pleaseInputContent: 'Please enter content to copy'
  },
  request: {
    logout: 'Logout user after request failed',
    logoutMsg: 'User status is invalid, please log in again',
    logoutWithModal: 'Pop up modal after request failed and then log out user',
    logoutWithModalMsg: 'User status is invalid, please log in again',
    refreshToken: 'The requested token has expired, refresh the token',
    tokenExpired: 'The requested token has expired'
  },
  theme: {
    themeSchema: {
      title: 'Theme Schema',
      light: 'Light',
      dark: 'Dark',
      auto: 'Follow System'
    },
    grayscale: 'Grayscale',
    colourWeakness: 'Colour Weakness',
    layoutMode: {
      title: 'Layout Mode',
      vertical: 'Vertical Menu Mode',
      horizontal: 'Horizontal Menu Mode',
      'vertical-mix': 'Vertical Mix Menu Mode',
      'horizontal-mix': 'Horizontal Mix menu Mode',
      reverseHorizontalMix: 'Reverse first level menus and child level menus position'
    },
    recommendColor: 'Apply Recommended Color Algorithm',
    recommendColorDesc: 'The recommended color algorithm refers to',
    themeColor: {
      title: 'Theme Color',
      primary: 'Primary',
      info: 'Info',
      success: 'Success',
      warning: 'Warning',
      error: 'Error',
      followPrimary: 'Follow Primary'
    },
    scrollMode: {
      title: 'Scroll Mode',
      wrapper: 'Wrapper',
      content: 'Content'
    },
    page: {
      animate: 'Page Animate',
      mode: {
        title: 'Page Animate Mode',
        fade: 'Fade',
        'fade-slide': 'Slide',
        'fade-bottom': 'Fade Zoom',
        'fade-scale': 'Fade Scale',
        'zoom-fade': 'Zoom Fade',
        'zoom-out': 'Zoom Out',
        none: 'None'
      }
    },
    fixedHeaderAndTab: 'Fixed Header And Tab',
    header: {
      height: 'Header Height',
      breadcrumb: {
        visible: 'Breadcrumb Visible',
        showIcon: 'Breadcrumb Icon Visible'
      },
      multilingual: {
        visible: 'Display multilingual button'
      }
    },
    tab: {
      visible: 'Tab Visible',
      cache: 'Tag Bar Info Cache',
      height: 'Tab Height',
      mode: {
        title: 'Tab Mode',
        chrome: 'Chrome',
        button: 'Button'
      }
    },
    sider: {
      inverted: 'Dark Sider',
      width: 'Sider Width',
      collapsedWidth: 'Sider Collapsed Width',
      mixWidth: 'Mix Sider Width',
      mixCollapsedWidth: 'Mix Sider Collapse Width',
      mixChildMenuWidth: 'Mix Child Menu Width'
    },
    footer: {
      visible: 'Footer Visible',
      fixed: 'Fixed Footer',
      height: 'Footer Height',
      right: 'Right Footer'
    },
    watermark: {
      visible: 'Watermark Full Screen Visible',
      text: 'Watermark Text'
    },
    themeDrawerTitle: 'Theme Configuration',
    pageFunTitle: 'Page Function',
    resetCacheStrategy: {
      title: 'Reset Cache Strategy',
      close: 'Close Page',
      refresh: 'Refresh Page'
    },
    configOperation: {
      copyConfig: 'Copy Config',
      copySuccessMsg: 'Copy Success, Please replace the variable "themeSettings" in "src/theme/settings.ts"',
      resetConfig: 'Reset Config',
      resetSuccessMsg: 'Reset Success'
    }
  },
  route: {
    login: 'Login',
    403: 'No permission',
    404: 'Page not found',
    500: 'Server error',
    'iframe-page': 'External page',
    home: 'Home',
    document: 'Document',
    document_content: 'Content',
    document_project: 'Project Document',
    'document_project-link': 'Project Document(external link)',
    document_vue: 'Vue Document',
    document_vite: 'Vite Document',
    document_unocss: 'UnoCSS Document',
    document_naive: 'Naive UI Document',
    document_antd: 'Ant Design Vue Document',
    'document_element-plus': 'Element Plus Document',
    document_alova: 'Alova Document',
    'document_content-message': 'Content Messages',
    'remote-page': 'Remote component',
    'remote-page_demo1': 'Remote Demo1',
    'remote-page_ai-model-manage': 'AI Model Manage',
    'remote-page_ai-content-publish': 'AI Content Publish',
    'user-center': 'User center',
    about: 'About',
    function: 'System Function',
    alova: 'Alova Example',
    alova_request: 'Alova Request',
    alova_user: 'User List',
    alova_scenes: 'Scenario Request',
    function_tab: 'Tab',
    'function_multi-tab': 'Multi Tab',
    'function_hide-child': 'Hide Child',
    'function_hide-child_one': 'Hide Child',
    'function_hide-child_two': 'Two',
    'function_hide-child_three': 'Three',
    function_request: 'Request',
    'function_toggle-auth': 'Toggle Auth',
    'function_super-page': 'Super Admin Visible',
    manage: 'System Manage',
    manage_user: 'User Manage',
    manage_ads: 'Advertisement Management',
    'manage_user-detail': 'User Detail',
    'document_content-tag': 'Content Tag',
    manage_role: 'Role Manage',
    manage_menu: 'Menu Manage',
    'multi-menu': 'Multi Menu',
    'multi-menu_first': 'Menu One',
    'multi-menu_first_child': 'Menu One Child',
    'multi-menu_second': 'Menu Two',
    'multi-menu_second_child': 'Menu Two Child',
    'multi-menu_second_child_home': 'Menu Two Child Home',
    exception: 'Exception',
    exception_403: '403',
    exception_404: '404',
    exception_500: '500',
    plugin: 'Plugin',
    plugin_copy: 'Copy',
    plugin_charts: 'Charts',
    plugin_charts_echarts: 'ECharts',
    plugin_charts_antv: 'AntV',
    plugin_charts_vchart: 'VChart',
    plugin_editor: 'Editor',
    plugin_editor_markdown: 'Markdown',
    plugin_icon: 'Icon',
    plugin_map: 'Map',
    plugin_print: 'Print',
    plugin_swiper: 'Swiper',
    plugin_video: 'Video',
    plugin_barcode: 'Barcode',
    plugin_pinyin: 'pinyin',
    plugin_excel: 'Excel',
    plugin_pdf: 'PDF preview',
    plugin_gantt: 'Gantt Chart',
    plugin_gantt_dhtmlx: 'dhtmlxGantt',
    plugin_gantt_vtable: 'VTableGantt',
    plugin_typeit: 'Typeit',
    plugin_tables: 'Tables',
    plugin_tables_vtable: 'VTable',
    'document_content-category': 'Content Category',
    'manage_system-option-log': 'System Operation Log',

    'manage_system-config': 'System Config',
    'manage_upload-file': 'Upload File',
    member: 'User Management',
    'member_reg-user': 'Registered Users',
    email: 'Email Management',
    'email_mail-template': 'Mail Template',
    extend: 'Extend Management',
    'extend_template-config': 'Template Config',
    extend_plugin: 'Plugin Management'
  },
  page: {
    login: {
      common: {
        loginOrRegister: 'Login / Register',
        userNamePlaceholder: 'Please enter username',
        phonePlaceholder: 'Please enter phone number',
        codePlaceholder: 'Please enter verification code',
        passwordPlaceholder: 'Please enter password',
        confirmPasswordPlaceholder: 'Please confirm password',
        codeLogin: 'Code Login',
        confirm: 'Confirm',
        back: 'Back',
        validateSuccess: 'Verification passed',
        loginSuccess: 'Login successfully',
        welcomeBack: 'Welcome back, {userName} !',
        imageCodePlaceholder: 'Please enter verification code',
        imageCode: 'Verification Code',
        imageCodeRequired: 'Please enter verification code'
      },
      pwdLogin: {
        title: 'Password Login',
        rememberMe: 'Remember me',
        forgetPassword: 'Forget password?',
        register: 'Register',
        otherAccountLogin: 'Other Account Login',
        otherLoginMode: 'Other Login Mode',
        superAdmin: 'Super Admin',
        admin: 'Admin',
        user: 'User'
      },
      initAdmin: {
        alertTitle: 'System Initialization',
        alertDesc: 'No administrator found. Please create one to continue.',
        button: 'Create Admin',
        title: 'Initialize Administrator',
        description: 'Create a full-access administrator account before using the system.',
        form: {
          userName: 'Username',
          nickName: 'Nickname',
          email: 'Email',
          phone: 'Phone Number',
          password: 'Password',
          confirmPassword: 'Confirm Password',
          gender: 'Gender',
          genderMale: 'Male',
          genderFemale: 'Female'
        },
        success: 'Administrator created. Please log in with the new account.'
      },
      codeLogin: {
        title: 'Verification Code Login',
        getCode: 'Get verification code',
        reGetCode: 'Reacquire after {time}s',
        sendCodeSuccess: 'Verification code sent successfully',
        imageCodePlaceholder: 'Please enter image verification code'
      },
      register: {
        title: 'Register',
        agreement: 'I have read and agree to',
        protocol: '《User Agreement》',
        policy: '《Privacy Policy》'
      },
      resetPwd: {
        title: 'Reset Password'
      },
      bindWeChat: {
        title: 'Bind WeChat'
      }
    },
    about: {
      title: 'About',
      introduction: `SoybeanAdmin is an elegant and powerful admin template, based on the latest front-end technology stack, including Vue3, Vite5, TypeScript, Pinia and UnoCSS. It has built-in rich theme configuration and components, strict code specifications, and an automated file routing system. In addition, it also uses the online mock data solution based on ApiFox. SoybeanAdmin provides you with a one-stop admin solution, no additional configuration, and out of the box. It is also a best practice for learning cutting-edge technologies quickly.`,
      projectInfo: {
        title: 'Project Info',
        version: 'Version',
        latestBuildTime: 'Latest Build Time',
        githubLink: 'Github Link',
        previewLink: 'Preview Link'
      },
      prdDep: 'Production Dependency',
      devDep: 'Development Dependency'
    },
    home: {
      branchDesc:
        'For the convenience of everyone in developing and updating the merge, we have streamlined the code of the main branch, only retaining the homepage menu, and the rest of the content has been moved to the example branch for maintenance. The preview address displays the content of the example branch.',
      greeting: {
        morning: 'Good morning, {userName}, today is another day full of vitality!',
        afternoon: 'Good afternoon, {userName}, keep the momentum going through the day!',
        evening: 'Good evening, {userName}, hope you had a productive day!',
        night: 'It is late, {userName}, rest well and recharge for tomorrow!'
      },
      weatherDesc: 'Today is cloudy to clear, 20℃ - 25℃!',
      projectCount: 'Project Count',
      todo: 'Todo',
      message: 'Message',
      downloadCount: 'Download Count',
      registerCount: 'Register Count',
      contentTotal: 'Total Content',
      pendingContent: 'Pending Content',
      pendingMessage: 'Pending Messages',
      todayNewContent: 'New Content Today',
      messageTotal: 'Total Messages',
      publishedContent: 'Published Content',
      draftContent: 'Draft Content',
      contentPublish: 'Content Publish Volume',
      contentDistribution: 'Content Distribution',
      headerDesc: 'Added {todayCount} pieces today, {pendingContents} pending review, {pendingMessages} messages awaiting action.',
      overviewLoadError: 'Failed to load the workspace overview, please retry later',
      trendLoadError: 'Failed to load trend data',
      healthLoadError: 'Failed to load system status',
      schedule: 'Work and rest Schedule',
      study: 'Study',
      work: 'Work',
      rest: 'Rest',
      entertainment: 'Entertainment',
      visitCount: 'Visit Count',
      turnover: 'Turnover',
      dealCount: 'Deal Count',
      projectNews: {
        title: 'Project News',
        moreNews: 'More News',
        desc1: 'DoraCMS created the open source project soybean-admin on May 28, 2021!',
        desc2: 'Yanbowe submitted a bug to soybean-admin, the multi-tab bar will not adapt.',
        desc3: 'DoraCMS is ready to do sufficient preparation for the release of soybean-admin!',
        desc4: 'DoraCMS is busy writing project documentation for soybean-admin!',
        desc5: 'DoraCMS just wrote some of the workbench pages casually, and it was enough to see!'
      },
      creativity: 'Creativity'
    },
    function: {
      tab: {
        tabOperate: {
          title: 'Tab Operation',
          addTab: 'Add Tab',
          addTabDesc: 'To about page',
          closeTab: 'Close Tab',
          closeCurrentTab: 'Close Current Tab',
          closeAboutTab: 'Close "About" Tab',
          addMultiTab: 'Add Multi Tab',
          addMultiTabDesc1: 'To MultiTab page',
          addMultiTabDesc2: 'To MultiTab page(with query params)'
        },
        tabTitle: {
          title: 'Tab Title',
          changeTitle: 'Change Title',
          change: 'Change',
          resetTitle: 'Reset Title',
          reset: 'Reset'
        }
      },
      multiTab: {
        routeParam: 'Route Param',
        backTab: 'Back function_tab'
      },
      toggleAuth: {
        toggleAccount: 'Toggle Account',
        authHook: 'Auth Hook Function `hasAuth`',
        superAdminVisible: 'Super Admin Visible',
        adminVisible: 'Admin Visible',
        adminOrUserVisible: 'Admin and User Visible'
      },
      request: {
        repeatedErrorOccurOnce: 'Repeated Request Error Occurs Once',
        repeatedError: 'Repeated Request Error',
        repeatedErrorMsg1: 'Custom Request Error 1',
        repeatedErrorMsg2: 'Custom Request Error 2'
      }
    },
    alova: {
      scenes: {
        captchaSend: 'Captcha Send',
        autoRequest: 'Auto Request',
        visibilityRequestTips: 'Automatically request when switching browser window',
        pollingRequestTips: 'It will request every 3 seconds',
        networkRequestTips: 'Automatically request after network reconnecting',
        refreshTime: 'Refresh Time',
        startRequest: 'Start Request',
        stopRequest: 'Stop Request',
        requestCrossComponent: 'Request Cross Component',
        triggerAllRequest: 'Manually Trigger All Automated Requests'
      }
    },
    manage: {
      common: {
        status: {
          enable: 'Enable',
          disable: 'Disable'
        }
      },
      role: {
        title: 'Role List',
        roleName: 'Role Name',
        roleCode: 'Role Code',
        roleStatus: 'Role Status',
        roleDesc: 'Role Description',
        menuAuth: 'Menu Auth',
        buttonAuth: 'Button Auth',
        form: {
          roleName: 'Please enter role name',
          roleCode: 'Please enter role code',
          roleStatus: 'Please select role status',
          roleDesc: 'Please enter role description'
        },
        addRole: 'Add Role',
        editRole: 'Edit Role'
      },
      user: {
        title: 'User List',
        userName: 'User Name',
        userGender: 'Gender',
        nickName: 'Nick Name',
        userPhone: 'Phone Number',
        userEmail: 'Email',
        userStatus: 'User Status',
        userRole: 'User Role',
        userAvatar: 'User Avatar',
        password: 'User Password',
        confirmPassword: 'Confirm Password',
        uploadSuccess: 'Upload Success',
        uploadFailed: 'Upload Failed',
        imageTypeError: 'Avatar image must be JPG/PNG/GIF/WEBP format!',
        imageSizeError: 'Avatar image size cannot exceed 2MB!',
        form: {
          userName: 'Please enter user name',
          userGender: 'Please select gender',
          nickName: 'Please enter nick name',
          userPhone: 'Please enter phone number',
          userEmail: 'Please enter email',
          userStatus: 'Please select user status',
          userRole: 'Please select user role',
          userAvatar: 'Please upload user avatar',
          password: 'Please select user password',
          confirmPassword: 'Please confirm user password'
        },
        addUser: 'Add User',
        editUser: 'Edit User',
        gender: {
          male: 'Male',
          female: 'Female'
        }
      },
      menu: {
        home: 'Home',
        title: 'Menu List',
        id: 'ID',
        parentId: 'Parent ID',
        menuType: 'Menu Type',
        menuName: 'Menu Name',
        routeName: 'Route Name',
        routePath: 'Route Path',
        pathParam: 'Path Param',
        layout: 'Layout Component',
        page: 'Page Component',
        i18nKey: 'I18n Key',
        icon: 'Icon',
        localIcon: 'Local Icon',
        iconTypeTitle: 'Icon Type',
        order: 'Order',
        constant: 'Constant',
        keepAlive: 'Keep Alive',
        href: 'Href',
        hideInMenu: 'Hide In Menu',
        activeMenu: 'Active Menu',
        multiTab: 'Multi Tab',
        fixedIndexInTab: 'Fixed Index In Tab',
        query: 'Query Params',
        button: 'Button',
        buttonDesc: 'Button Desc',
        buttonPermissionCode: 'Permission Identifier',
        buttonHttpMethod: 'HTTP Method',
        menuStatus: 'Menu Status',
        form: {
          home: 'Please select home',
          menuType: 'Please select menu type',
          menuName: 'Please enter menu name',
          routeName: 'Please enter route name',
          routePath: 'Please enter route path',
          pathParam: 'Please enter path param',
          page: 'Please select page component',
          layout: 'Please select layout component',
          i18nKey: 'Please enter i18n key',
          icon: 'Please enter iconify name',
          localIcon: 'Please enter local icon name',
          order: 'Please enter order',
          keepAlive: 'Please select whether to cache route',
          href: 'Please enter href',
          hideInMenu: 'Please select whether to hide menu',
          activeMenu: 'Please select route name of the highlighted menu',
          multiTab: 'Please select whether to support multiple tabs',
          fixedInTab: 'Please select whether to fix in the tab',
          fixedIndexInTab: 'Please enter the index fixed in the tab',
          queryKey: 'Please enter route parameter Key',
          queryValue: 'Please enter route parameter Value',
          button: 'Please select whether it is a button',
          buttonDesc: 'Please enter button description',
          buttonApi: 'Please enter button api',
          buttonPermissionCode: 'Please enter permission identifier',
          buttonHttpMethod: 'Please select HTTP method',
          menuStatus: 'Please select menu status',
          buttonPermissionCodeDuplicate: 'Permission identifier cannot be duplicated'
        },
        security: {
          apiFormatTip: 'API format: module/operation, e.g. user/getList. Only letters and numbers allowed, no special characters',
          apiValidation: {
            formatError: 'API format is incorrect, should be "module/operation" format',
            tooLong: 'API path is too long, cannot exceed 100 characters',
            dangerousChars: 'API contains dangerous characters, < > " \' & space .. // are not allowed',
            operationFormatError: 'Operation name format is incorrect, only letters and numbers allowed, must start with letter',
            dangerousOperation: 'Operation name is forbidden, security risk exists',
            operationTooLong: 'Operation name is too long, cannot exceed 50 characters'
          },
          configErrors: 'API Configuration Errors'
        },
        addMenu: 'Add Menu',
        editMenu: 'Edit Menu',
        addChildMenu: 'Add Child Menu',
        type: {
          directory: 'Directory',
          menu: 'Menu'
        },
        iconType: {
          iconify: 'Iconify Icon',
          local: 'Local Icon'
        }
      },
      systemOptionLog: {
        title: 'System Operation Log',
        type: 'Log Type',
        logs: 'Log Content',
        module: 'Module',
        action: 'Action',
        user_name: 'User Name',
        user_type: 'User Type',
        ip_address: 'IP Address',
        request_path: 'Request Path',
        request_method: 'Request Method',
        response_status: 'Response Status',
        response_time: 'Response Time',
        severity: 'Severity',
        environment: 'Environment',
        resource_type: 'Resource Type',
        resource_id: 'Resource ID',
        createdAt: 'Created At',
        clearAll: 'Clear All Logs',
        viewDetail: 'View Detail',
        logDetail: 'Log Detail',
        basicInfo: 'Basic Info',
        requestInfo: 'Request Info',
        responseInfo: 'Response Info',
        userInfo: 'User Info',
        operationInfo: 'Operation Info',
        errorInfo: 'Error Info',
        additionalInfo: 'Additional Info',
        old_value: 'Old Value',
        new_value: 'New Value',
        error_message: 'Error Message',
        error_code: 'Error Code',
        error_stack: 'Error Stack',
        trace_id: 'Trace ID',
        session_id: 'Session ID',
        user_agent: 'User Agent',
        client_platform: 'Client Platform',
        client_version: 'Client Version',
        request_params: 'Request Params',
        request_body: 'Request Body',
        request_query: 'Query Params',
        response_size: 'Response Size',
        is_handled: 'Is Handled',
        tags: 'Tags',
        extra_data: 'Extra Data',
        typeOptions: {
          login: 'Login',
          logout: 'Logout',
          exception: 'Exception',
          operation: 'Operation',
          access: 'Access',
          error: 'Error',
          warning: 'Warning',
          info: 'Info',
          debug: 'Debug'
        },
        userTypeOptions: {
          admin: 'Admin',
          user: 'User',
          guest: 'Guest',
          system: 'System'
        },
        severityOptions: {
          low: 'Low',
          medium: 'Medium',
          high: 'High',
          critical: 'Critical'
        },
        environmentOptions: {
          local: 'Local',
          development: 'Development',
          staging: 'Staging',
          production: 'Production'
        },
        form: {
          type: 'Please select log type',
          module: 'Please enter module name',
          action: 'Please enter action',
          user_name: 'Please enter user name',
          user_type: 'Please select user type',
          severity: 'Please select severity',
          environment: 'Please select environment',
          ip_address: 'Please enter IP address',
          start_date: 'Please select start date',
          end_date: 'Please select end date',
          keyword: 'Please enter keyword'
        },
        startDate: 'Start Date',
        endDate: 'End Date',
        dateRange: 'Date Range',
        keyword: 'Keyword',
        stats: {
          title: 'Log Statistics',
          total: 'Total Logs',
          today: 'Today Logs',
          byType: 'By Type',
          bySeverity: 'By Severity',
          byModule: 'By Module'
        },
        export: 'Export Logs',
        exportSuccess: 'Export Success',
        exportFailed: 'Export Failed'
      },

      systemConfig: {
        title: 'System Config',
        key: 'Config Key',
        value: 'Config Value',
        type: 'Type',
        public: 'Is Public',
        addConfig: 'Add Config',
        editConfig: 'Edit Config',
        form: {
          key: 'Please enter config key',
          value: 'Please enter config value',
          type: 'Please select config type',
          public: 'Please select if public'
        }
      },
      uploadFile: {
        title: 'Upload Configuration',
        type: 'Upload Type',
        local: 'Local',
        qiniu: 'Qiniu Cloud',
        aliyun: 'Aliyun OSS',
        uploadPath: 'Upload Path',
        qn_bucket: 'Bucket',
        qn_accessKey: 'Access Key',
        qn_secretKey: 'Secret Key',
        qn_zone: 'Zone',
        qn_endPoint: 'Endpoint',
        oss_bucket: 'Bucket',
        oss_accessKey: 'Access Key',
        oss_secretKey: 'Secret Key',
        oss_region: 'Region',
        oss_endPoint: 'Endpoint',
        oss_apiVersion: 'API Version',
        form: {
          uploadPath: 'Please enter upload path',
          qn_bucket: 'Please enter bucket name',
          qn_accessKey: 'Please enter access key',
          qn_secretKey: 'Please enter secret key',
          qn_zone: 'Please enter zone',
          qn_endPoint: 'Please enter endpoint',
          oss_bucket: 'Please enter bucket name',
          oss_accessKey: 'Please enter access key',
          oss_secretKey: 'Please enter secret key',
          oss_region: 'Please enter region',
          oss_endPoint: 'Please enter endpoint',
          oss_apiVersion: 'Please enter API version'
        }
      }
    },
    document: {
      ads: {
        title: 'Advertisement Management',
        name: 'Name',
        type: 'Type',
        type_image: 'Image',
        type_text: 'Text',
        state: 'State',
        carousel: 'Carousel',
        height: 'Height',
        comments: 'Description',
        items: 'Items',
        item: 'Item',
        link: 'Link',
        alt: 'Alt',
        target: 'Target',
        image: 'Image',
        copyCode: 'Copy Code',
        typeOptions: {
          image: 'Image',
          text: 'Text'
        }
      },
      contentCategory: {
        title: 'Category',
        add: 'Add Category',
        addSub: 'Add Sub Category',
        edit: 'Edit Category',
        name: 'Category Name',
        parentName: 'Parent Category',
        enable: 'Enabled',
        type: 'Category Type',
        typeNormal: 'Normal',
        typeSinger: 'Single Page',
        icon: 'Category Icon',
        cover: 'Category Cover',
        template: 'Category Template',
        seoUrl: 'SEO URL',
        sort: 'Sort',
        keywords: 'Keywords',
        description: 'Description',
        nameRequired: 'Category name is required',
        nameLength: 'Category name cannot exceed 20 characters',
        seoUrlRequired: 'SEO URL is required',
        descriptionRequired: 'Description is required',
        descriptionLength: 'Description cannot exceed 200 characters',
        imageTypeError: 'Invalid image type',
        imageSizeError: 'Image size cannot exceed 2MB',
        form: {
          icon: 'Please enter icon name'
        }
      },
      content: {
        title: 'Content Management',
        mainTitle: 'Title',
        subTitle: 'Subtitle',
        category: 'Category',
        tags: 'Tags',
        type: 'Type',
        author: 'Author',
        publishDate: 'Publish Date',
        state: 'State',
        draft: 'Draft',
        clickNum: 'Click Num',
        commentNum: 'Comment Num',
        pendingReview: 'Pending Review',
        approved: 'Approved',
        offline: 'Offline',
        addContent: 'Add Content',
        editContent: 'Edit Content',
        batchChangeCategory: 'Batch Change Category',
        selectCover: 'Select Cover',
        recyclebin: 'Recycle Bin',
        selectContentFirst: 'Please select content first',
        selectCoverFirst: 'Please select cover first',
        selectCategory: 'Select Category',
        selectedContent: 'You have selected',
        items: 'items',
        keywords: 'Keywords',
        coverImage: 'Cover Image',
        uploadCover: 'Upload Cover',
        description: 'Description',
        content: 'Content',
        comments: 'Comments',
        source: 'Source',
        isTop: 'Recommended',
        isPinned: 'Pinned',
        isPublished: 'Published',
        hideForm: 'Hide Form',
        batchRestore: 'Batch Restore',
        restore: 'Restore',
        confirmRestore: 'Confirm restore this content?',
        operateSuccess: 'Operation successful',
        form: {
          imageFormatError: 'Only jpeg, jpg, png, and gif images are allowed',
          imageSizeError: 'Image size cannot exceed 2MB',
          contentPlaceholder: 'Please enter content...',
          keywordsSeparator: 'Separate multiple keywords with commas'
        }
      },
      contentMessage: {
        title: 'Message Management',
        userSaid: 'User Message',
        content: 'Message Content',
        author: 'Author',
        replyAuthor: 'Reply To',
        auditStatus: 'Audit Status',
        praiseNum: 'Likes',
        despiseNum: 'Dislikes',
        createdAt: 'Message Time',
        form: {
          searchContent: 'Please enter message content',
          selectAuditStatus: 'Please select audit status'
        },
        reply: 'Reply',
        replyUser: 'Reply to User Message',
        stitle: 'Article Title',
        auditStatusOptions: {
          pending: 'Pending',
          approved: 'Approved',
          rejected: 'Rejected'
        }
      }
    },
    member: {
      regUser: {
        title: 'Registered Users',
        userName: 'Username',
        phone: 'Phone',
        email: 'Email',
        role: 'Role',
        status: 'Status',
        registerTime: 'Register Time',
        comments: 'Comments',
        editUser: 'Edit User',
        normalUser: 'Normal User',
        adminUser: 'Admin User'
      }
    },
    email: {
      mailTemplate: {
        title: 'Mail Template Management',
        type: 'Type',
        comment: 'Comment',
        templateTitle: 'Title',
        subTitle: 'Sub Title',
        content: 'Content',
        createdAt: 'Create Time',
        tags: 'Template Tags',
        form: {
          type: 'Please select template type',
          comment: 'Please enter template comment',
          title: 'Please enter template title',
          subTitle: 'Please enter template subtitle',
          content: 'Please enter template content'
        },
        addTemplate: 'Add Template',
        editTemplate: 'Edit Template',
        commonTags: 'Common Tags',
        passwordRecoveryTags: 'Password Recovery Tags',
        messageTags: 'Message Notification Tags',
        verificationTags: 'Email Verification Tags',
        tag: {
          siteName: '[Site Name]siteName',
          siteDomain: '[Site Domain]siteDomain',
          email: '[User Email]email',
          passwordToken: '[Reset Token]token',
          messageAuthor: '[Message Author]message_author_userName',
          messageSendDate: '[Message Time]message_sendDate',
          messageContentTitle: '[Message Related Title]message_content_title',
          messageContentId: '[Message Related ID]message_content_id',
          verificationCode: '[Verification Code]msgCode'
        }
      },
    },
    extend: {
      templateConfig: {
        title: 'Template Configuration',
        templateMarket: 'Template Market',
        installedTemplates: 'Installed Templates',
        uploadTemplate: 'Upload Template',
        author: 'Author',
        version: 'Version',
        introduction: 'Introduction',
        price: 'Price',
        free: 'Free',
        action: 'Action',
        install: 'Install',
        preview: 'Preview',
        enable: 'Enable',
        uninstall: 'Uninstall',
        update: 'Update',
        currentTheme: 'Current Theme',
        systemTemplate: 'System Template',
        templateConfig: 'Template Configuration',
        addTemplateItem: 'Add Template Item',
        form: {
          name: 'Name',
          alias: 'Alias',
          template: 'Template',
          comments: 'Comments',
          installSuccessMsg: 'Template installed successfully',
          uninstallSuccessMsg: 'Template uninstalled successfully',
          enableSuccessMsg: 'Template enabled successfully',
          updateSuccessMsg: 'Template updated successfully',
          uploadSuccessMsg: 'Template uploaded successfully',
        uploadFailMsg: 'Template upload failed',
        limitFileType: 'Only ZIP files are allowed',
        limitFileSize: 'File size cannot exceed 10MB',
        operationInProgress: 'Operation in progress, please wait...',
        installInProgress: 'Installing template, please wait...',
        updateInProgress: 'Updating template, please wait...',
        enableInProgress: 'Enabling template, please wait...',
        uninstallInProgress: 'Uninstalling template, please wait...',
        processing: 'Processing...'
      },
      downloadExample: 'Download Template Example',
      paymentTitle: 'Alipay Payment',
      selectTemplate: 'Please select template',
      templateItems: 'Template Items'
    },
      plugin: {
        title: 'Plugin Management',
        installedTitle: 'Installed Plugins',
        shopTitle: 'Plugin Store',
        name: 'Name',
        description: 'Description',
        version: 'Version',
        hooks: 'Hooks',
        amount: 'Price',
        state: 'State',
        install: 'Install',
        uninstall: 'Uninstall',
        update: 'Update',
        installed: 'Installed',
        notInstalled: 'Not Installed',
        enable: 'Enable',
        createdAt: 'Create Time',
        updatedAt: 'Update Time',
        free: 'Free',
        installNotice: 'Are you sure you want to install this plugin?',
        uninstallNotice: 'Are you sure you want to uninstall this plugin?',
        updateNotice: 'Are you sure you want to update this plugin?',
        buyConfirm: 'Are you sure you want to purchase this plugin?',
        scanToPay: 'Scan to Pay',
        pluginDetail: 'Plugin Details',
        form: {
          name: 'Please input plugin name',
          description: 'Please input plugin description'
        }
      }
    }
  },
  form: {
    required: 'Cannot be empty',
    userName: {
      required: 'Please enter user name',
      invalid: 'User name format is incorrect'
    },
    phone: {
      required: 'Please enter phone number',
      invalid: 'Phone number format is incorrect'
    },
    pwd: {
      required: 'Please enter password',
      invalid: '6-18 characters, including letters, numbers, and underscores'
    },
    confirmPwd: {
      required: 'Please enter password again',
      invalid: 'The two passwords are inconsistent'
    },
    code: {
      required: 'Please enter verification code',
      invalid: 'Verification code format is incorrect'
    },
    email: {
      required: 'Please enter email',
      invalid: 'Email format is incorrect'
    }
  },
  dropdown: {
    closeCurrent: 'Close Current',
    closeOther: 'Close Other',
    closeLeft: 'Close Left',
    closeRight: 'Close Right',
    closeAll: 'Close All'
  },
  icon: {
    themeConfig: 'Theme Configuration',
    themeSchema: 'Theme Schema',
    lang: 'Switch Language',
    fullscreen: 'Fullscreen',
    fullscreenExit: 'Exit Fullscreen',
    reload: 'Reload Page',
    collapse: 'Collapse Menu',
    expand: 'Expand Menu',
    pin: 'Pin',
    unpin: 'Unpin',
    searchIcon: 'Search Icon',
    clickToSelectIcon: 'Click to Select Icon',
    noResultFound: 'No results found'
  },
  datatable: {
    itemCount: 'Total {total} items'
  },
  component: {
    iconSelect: {
      searchPlaceholder: 'Search Icon',
      selectPlaceholder: 'Click to Select Icon',
      noResult: 'No results found'
    },
    coverSelect: {
      searchPlaceholder: 'Search Cover',
      selectTypePlaceholder: 'Select Type',
      nameLabel: 'Name',
      typeLabel: 'Type',
      previewLabel: 'Preview',
      operateLabel: 'Action',
      noImage: 'No Image',
      selected: 'Selected',
      select: 'Select'
    }
  }
};

export default local;
