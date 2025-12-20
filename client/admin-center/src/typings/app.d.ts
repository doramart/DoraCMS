/** The global namespace for the app */
declare namespace App {
  /** Theme namespace */
  namespace Theme {
    type ColorPaletteNumber = import('@sa/color').ColorPaletteNumber;

    /** Theme setting */
    interface ThemeSetting {
      /** Theme scheme */
      themeScheme: UnionKey.ThemeScheme;
      /** grayscale mode */
      grayscale: boolean;
      /** colour weakness mode */
      colourWeakness: boolean;
      /** Whether to recommend color */
      recommendColor: boolean;
      /** Theme color */
      themeColor: string;
      /** Other color */
      otherColor: OtherColor;
      /** Whether info color is followed by the primary color */
      isInfoFollowPrimary: boolean;
      /** Reset cache strategy */
      resetCacheStrategy: UnionKey.ResetCacheStrategy;
      /** Layout */
      layout: {
        /** Layout mode */
        mode: UnionKey.ThemeLayoutMode;
        /** Scroll mode */
        scrollMode: UnionKey.ThemeScrollMode;
        /**
         * Whether to reverse the horizontal mix
         *
         * if true, the vertical child level menus in left and horizontal first level menus in top
         */
        reverseHorizontalMix: boolean;
      };
      /** Page */
      page: {
        /** Whether to show the page transition */
        animate: boolean;
        /** Page animate mode */
        animateMode: UnionKey.ThemePageAnimateMode;
      };
      /** Header */
      header: {
        /** Header height */
        height: number;
        /** Header breadcrumb */
        breadcrumb: {
          /** Whether to show the breadcrumb */
          visible: boolean;
          /** Whether to show the breadcrumb icon */
          showIcon: boolean;
        };
        /** Multilingual */
        multilingual: {
          /** Whether to show the multilingual */
          visible: boolean;
        };
      };
      /** Tab */
      tab: {
        /** Whether to show the tab */
        visible: boolean;
        /**
         * Whether to cache the tab
         *
         * If cache, the tabs will get from the local storage when the page is refreshed
         */
        cache: boolean;
        /** Tab height */
        height: number;
        /** Tab mode */
        mode: UnionKey.ThemeTabMode;
      };
      /** Fixed header and tab */
      fixedHeaderAndTab: boolean;
      /** Sider */
      sider: {
        /** Inverted sider */
        inverted: boolean;
        /** Sider width */
        width: number;
        /** Collapsed sider width */
        collapsedWidth: number;
        /** Sider width when the layout is 'vertical-mix' or 'horizontal-mix' */
        mixWidth: number;
        /** Collapsed sider width when the layout is 'vertical-mix' or 'horizontal-mix' */
        mixCollapsedWidth: number;
        /** Child menu width when the layout is 'vertical-mix' or 'horizontal-mix' */
        mixChildMenuWidth: number;
      };
      /** Footer */
      footer: {
        /** Whether to show the footer */
        visible: boolean;
        /** Whether fixed the footer */
        fixed: boolean;
        /** Footer height */
        height: number;
        /** Whether float the footer to the right when the layout is 'horizontal-mix' */
        right: boolean;
      };
      /** Watermark */
      watermark: {
        /** Whether to show the watermark */
        visible: boolean;
        /** Watermark text */
        text: string;
      };
      /** define some theme settings tokens, will transform to css variables */
      tokens: {
        light: ThemeSettingToken;
        dark?: {
          [K in keyof ThemeSettingToken]?: Partial<ThemeSettingToken[K]>;
        };
      };
    }

    interface OtherColor {
      info: string;
      success: string;
      warning: string;
      error: string;
    }

    interface ThemeColor extends OtherColor {
      primary: string;
    }

    type ThemeColorKey = keyof ThemeColor;

    type ThemePaletteColor = {
      [key in ThemeColorKey | `${ThemeColorKey}-${ColorPaletteNumber}`]: string;
    };

    type BaseToken = Record<string, Record<string, string>>;

    interface ThemeSettingTokenColor {
      /** the progress bar color, if not set, will use the primary color */
      nprogress?: string;
      container: string;
      layout: string;
      inverted: string;
      'base-text': string;
    }

    interface ThemeSettingTokenBoxShadow {
      header: string;
      sider: string;
      tab: string;
    }

    interface ThemeSettingToken {
      colors: ThemeSettingTokenColor;
      boxShadow: ThemeSettingTokenBoxShadow;
    }

    type ThemeTokenColor = ThemePaletteColor & ThemeSettingTokenColor;

    /** Theme token CSS variables */
    type ThemeTokenCSSVars = {
      colors: ThemeTokenColor & { [key: string]: string };
      boxShadow: ThemeSettingTokenBoxShadow & { [key: string]: string };
    };
  }

  /** Global namespace */
  namespace Global {
    type VNode = import('vue').VNode;
    type RouteLocationNormalizedLoaded = import('vue-router').RouteLocationNormalizedLoaded;
    type RouteKey = import('@elegant-router/types').RouteKey;
    type RouteMap = import('@elegant-router/types').RouteMap;
    type RoutePath = import('@elegant-router/types').RoutePath;
    type LastLevelRouteKey = import('@elegant-router/types').LastLevelRouteKey;

    /** The global header props */
    interface HeaderProps {
      /** Whether to show the logo */
      showLogo?: boolean;
      /** Whether to show the menu toggler */
      showMenuToggler?: boolean;
      /** Whether to show the menu */
      showMenu?: boolean;
    }

    /** The global menu */
    type Menu = {
      /**
       * The menu key
       *
       * Equal to the route key
       */
      key: string;
      /** The menu label */
      label: string;
      /** The menu i18n key */
      i18nKey?: I18n.I18nKey | null;
      /** The route key */
      routeKey: RouteKey;
      /** The route path */
      routePath: RoutePath;
      /** The menu icon */
      icon?: () => VNode;
      /** The menu children */
      children?: Menu[];
    };

    type Breadcrumb = Omit<Menu, 'children'> & {
      options?: Breadcrumb[];
    };

    /** Tab route */
    type TabRoute = Pick<RouteLocationNormalizedLoaded, 'name' | 'path' | 'meta'> &
      Partial<Pick<RouteLocationNormalizedLoaded, 'fullPath' | 'query' | 'matched'>>;

    /** The global tab */
    type Tab = {
      /** The tab id */
      id: string;
      /** The tab label */
      label: string;
      /**
       * The new tab label
       *
       * If set, the tab label will be replaced by this value
       */
      newLabel?: string;
      /**
       * The old tab label
       *
       * when reset the tab label, the tab label will be replaced by this value
       */
      oldLabel?: string;
      /** The tab route key */
      routeKey: LastLevelRouteKey;
      /** The tab route path */
      routePath: RouteMap[LastLevelRouteKey];
      /** The tab route full path */
      fullPath: string;
      /** The tab fixed index */
      fixedIndex?: number | null;
      /**
       * Tab icon
       *
       * Iconify icon
       */
      icon?: string;
      /**
       * Tab local icon
       *
       * Local icon
       */
      localIcon?: string;
      /** I18n key */
      i18nKey?: I18n.I18nKey | null;
    };

    /** Form rule */
    type FormRule = import('element-plus').FormItemRule;

    /** The global dropdown key */
    type DropdownKey = 'closeCurrent' | 'closeOther' | 'closeLeft' | 'closeRight' | 'closeAll';
  }

  /**
   * I18n namespace
   *
   * Locales type
   */
  namespace I18n {
    type RouteKey = import('@elegant-router/types').RouteKey;

    type LangType = 'en-US' | 'zh-CN';

    type LangOption = {
      label: string;
      key: LangType;
    };

    type I18nRouteKey = Exclude<RouteKey, 'root' | 'not-found'>;

    type FormMsg = {
      required: string;
      invalid: string;
    };

    type Schema = {
      system: {
        title: string;
        updateTitle: string;
        updateContent: string;
        updateConfirm: string;
        updateCancel: string;
      };
      common: {
        action: string;
        add: string;
        addSuccess: string;
        backToHome: string;
        batchDelete: string;
        cancel: string;
        close: string;
        check: string;
        expandColumn: string;
        columnSetting: string;
        config: string;
        confirm: string;
        delete: string;
        deleteSuccess: string;
        confirmDelete: string;
        edit: string;
        warning: string;
        error: string;
        index: string;
        keywordSearch: string;
        logout: string;
        logoutConfirm: string;
        lookForward: string;
        modify: string;
        modifySuccess: string;
        modifyError: string;
        submitError: string;
        noData: string;
        operate: string;
        pleaseCheckValue: string;
        refresh: string;
        reset: string;
        search: string;
        switch: string;
        tip: string;
        trigger: string;
        update: string;
        updateSuccess: string;
        operateSuccess: string;
        userCenter: string;
        uploadSuccess: string;
        uploadError: string;
        yesOrNo: {
          yes: string;
          no: string;
        };
        input: {
          placeholder: string;
        };
        validation: {
          confirmPasswordRequired: string;
          passwordNotMatch: string;
          phone: string;
          email: string;
        };
        searchPlaceholder: string;
        required: string;
        name: string;
        description: string;
        createdAt: string;
        updatedAt: string;
        contentTag: string;
        upload: string;
        button: string;
        browserNotSupport: string;
        copySuccess: string;
        pleaseInputContent: string;
      };
      request: {
        logout: string;
        logoutMsg: string;
        logoutWithModal: string;
        logoutWithModalMsg: string;
        refreshToken: string;
        tokenExpired: string;
      };
      theme: {
        themeSchema: { title: string } & Record<UnionKey.ThemeScheme, string>;
        grayscale: string;
        colourWeakness: string;
        layoutMode: { title: string; reverseHorizontalMix: string } & Record<UnionKey.ThemeLayoutMode, string>;
        recommendColor: string;
        recommendColorDesc: string;
        themeColor: {
          title: string;
          followPrimary: string;
        } & Theme.ThemeColor;
        scrollMode: { title: string } & Record<UnionKey.ThemeScrollMode, string>;
        page: {
          animate: string;
          mode: { title: string } & Record<UnionKey.ThemePageAnimateMode, string>;
        };
        fixedHeaderAndTab: string;
        header: {
          height: string;
          breadcrumb: {
            visible: string;
            showIcon: string;
          };
          multilingual: {
            visible: string;
          };
        };
        tab: {
          visible: string;
          cache: string;
          height: string;
          mode: { title: string } & Record<UnionKey.ThemeTabMode, string>;
        };
        sider: {
          inverted: string;
          width: string;
          collapsedWidth: string;
          mixWidth: string;
          mixCollapsedWidth: string;
          mixChildMenuWidth: string;
        };
        footer: {
          visible: string;
          fixed: string;
          height: string;
          right: string;
        };
        watermark: {
          visible: string;
          text: string;
        };
        themeDrawerTitle: string;
        pageFunTitle: string;
        resetCacheStrategy: { title: string } & Record<UnionKey.ResetCacheStrategy, string>;
        configOperation: {
          copyConfig: string;
          copySuccessMsg: string;
          resetConfig: string;
          resetSuccessMsg: string;
        };
      };
      route: Record<I18nRouteKey, string> & {
        document_content: string;
        'document_content-message': string;
        function: string;
        alova: string;
      };
      page: {
        login: {
          common: {
            loginOrRegister: string;
            userNamePlaceholder: string;
            phonePlaceholder: string;
            codePlaceholder: string;
            passwordPlaceholder: string;
            confirmPasswordPlaceholder: string;
            codeLogin: string;
            confirm: string;
            back: string;
            validateSuccess: string;
            loginSuccess: string;
            welcomeBack: string;
            imageCodePlaceholder: string;
            imageCode: string;
            imageCodeRequired: string;
          };
          pwdLogin: {
            title: string;
            rememberMe: string;
            forgetPassword: string;
            register: string;
            otherAccountLogin: string;
            otherLoginMode: string;
            superAdmin: string;
            admin: string;
            user: string;
          };
          initAdmin: {
            alertTitle: string;
            alertDesc: string;
            button: string;
            title: string;
            description: string;
            form: {
              userName: string;
              nickName: string;
              email: string;
              phone: string;
              password: string;
              confirmPassword: string;
              gender: string;
              genderMale: string;
              genderFemale: string;
            };
            success: string;
          };
          codeLogin: {
            title: string;
            getCode: string;
            reGetCode: string;
            sendCodeSuccess: string;
            imageCodePlaceholder: string;
          };
          register: {
            title: string;
            agreement: string;
            protocol: string;
            policy: string;
          };
          resetPwd: {
            title: string;
          };
          bindWeChat: {
            title: string;
          };
        };
        about: {
          title: string;
          introduction: string;
          projectInfo: {
            title: string;
            version: string;
            latestBuildTime: string;
            githubLink: string;
            previewLink: string;
          };
          prdDep: string;
          devDep: string;
        };
        home: {
          branchDesc: string;
          greeting: {
            morning: String,
            afternoon: String,
            evening: String,
            night: String,
          };
          weatherDesc: string;
          projectCount: string;
          todo: string;
          message: string;
          downloadCount: string;
          registerCount: string;
          contentTotal: string;
          pendingContent: string;
          pendingMessage: string;
          todayNewContent: string;
          messageTotal: string;
          publishedContent: string;
          draftContent: string;
          contentPublish: string;
          contentDistribution: string;
          headerDesc: string;
          overviewLoadError: string;
          trendLoadError: string;
          healthLoadError: string;
          schedule: string;
          study: string;
          work: string;
          rest: string;
          entertainment: string;
          visitCount: string;
          turnover: string;
          dealCount: string;
          projectNews: {
            title: string;
            moreNews: string;
            desc1: string;
            desc2: string;
            desc3: string;
            desc4: string;
            desc5: string;
          };
          creativity: string;
        };
        function: {
          tab: {
            tabOperate: {
              title: string;
              addTab: string;
              addTabDesc: string;
              closeTab: string;
              closeCurrentTab: string;
              closeAboutTab: string;
              addMultiTab: string;
              addMultiTabDesc1: string;
              addMultiTabDesc2: string;
            };
            tabTitle: {
              title: string;
              changeTitle: string;
              change: string;
              resetTitle: string;
              reset: string;
            };
          };
          multiTab: {
            routeParam: string;
            backTab: string;
          };
          toggleAuth: {
            toggleAccount: string;
            authHook: string;
            superAdminVisible: string;
            adminVisible: string;
            adminOrUserVisible: string;
          };
          request: {
            repeatedErrorOccurOnce: string;
            repeatedError: string;
            repeatedErrorMsg1: string;
            repeatedErrorMsg2: string;
          };
        };
        alova: {
          scenes: {
            captchaSend: string;
            autoRequest: string;
            visibilityRequestTips: string;
            pollingRequestTips: string;
            networkRequestTips: string;
            refreshTime: string;
            startRequest: string;
            stopRequest: string;
            requestCrossComponent: string;
            triggerAllRequest: string;
          };
        };
        manage: {
          common: {
            status: {
              enable: string;
              disable: string;
            };
          };
          role: {
            title: string;
            roleName: string;
            roleCode: string;
            roleStatus: string;
            roleDesc: string;
            form: {
              roleName: string;
              roleCode: string;
              roleStatus: string;
              roleDesc: string;
            };
            addRole: string;
            editRole: string;
            menuAuth: string;
            buttonAuth: string;
          };
          user: {
            title: string;
            userName: string;
            userGender: string;
            nickName: string;
            userPhone: string;
            userEmail: string;
            userStatus: string;
            userRole: string;
            userAvatar: string;
            password: string;
            confirmPassword: string;
            uploadSuccess: string;
            uploadFailed: string;
            imageTypeError: string;
            imageSizeError: string;
            form: {
              userName: string;
              userGender: string;
              nickName: string;
              userPhone: string;
              userEmail: string;
              userStatus: string;
              userRole: string;
              userAvatar: string;
              password: string;
              confirmPassword: string;
            };
            addUser: string;
            editUser: string;
            gender: {
              male: string;
              female: string;
            };
          };
          menu: {
            home: string;
            title: string;
            id: string;
            parentId: string;
            menuType: string;
            menuName: string;
            routeName: string;
            routePath: string;
            pathParam: string;
            layout: string;
            page: string;
            i18nKey: string;
            icon: string;
            localIcon: string;
            iconTypeTitle: string;
            order: string;
            constant: string;
            keepAlive: string;
            href: string;
            hideInMenu: string;
            activeMenu: string;
            multiTab: string;
            fixedIndexInTab: string;
            query: string;
            button: string;
            buttonDesc: string;
            buttonPermissionCode: string;
            buttonHttpMethod: string;
            menuStatus: string;
            form: {
              home: string;
              menuType: string;
              menuName: string;
              routeName: string;
              routePath: string;
              pathParam: string;
              layout: string;
              page: string;
              i18nKey: string;
              icon: string;
              localIcon: string;
              order: string;
              keepAlive: string;
              href: string;
              hideInMenu: string;
              activeMenu: string;
              multiTab: string;
              fixedInTab: string;
              fixedIndexInTab: string;
              queryKey: string;
              queryValue: string;
              button: string;
              buttonDesc: string;
              buttonApi: string;
              buttonPermissionCode: string;
              buttonHttpMethod: string;
              menuStatus: string;
              buttonPermissionCodeDuplicate: string;
            };
            security: {
              apiFormatTip: string;
              apiValidation: {
                formatError: string;
                tooLong: string;
                dangerousChars: string;
                operationFormatError: string;
                dangerousOperation: string;
                operationTooLong: string;
              };
              configErrors: string;
            };
            addMenu: string;
            editMenu: string;
            addChildMenu: string;
            type: {
              directory: string;
              menu: string;
            };
            iconType: {
              iconify: string;
              local: string;
            };
          };

          systemOptionLog: {
            title: string;
            type: string;
            logs: string;
            module: string;
            action: string;
            user_name: string;
            user_type: string;
            ip_address: string;
            request_path: string;
            request_method: string;
            response_status: string;
            response_time: string;
            severity: string;
            environment: string;
            resource_type: string;
            resource_id: string;
            createdAt: string;
            clearAll: string;
            viewDetail: string;
            logDetail: string;
            basicInfo: string;
            requestInfo: string;
            responseInfo: string;
            userInfo: string;
            operationInfo: string;
            errorInfo: string;
            additionalInfo: string;
            old_value: string;
            new_value: string;
            error_message: string;
            error_code: string;
            error_stack: string;
            trace_id: string;
            session_id: string;
            user_agent: string;
            client_platform: string;
            client_version: string;
            request_params: string;
            request_body: string;
            request_query: string;
            response_size: string;
            is_handled: string;
            tags: string;
            extra_data: string;
            typeOptions: {
              login: string;
              logout: string;
              exception: string;
              operation: string;
              access: string;
              error: string;
              warning: string;
              info: string;
              debug: string;
            };
            userTypeOptions: {
              admin: string;
              user: string;
              guest: string;
              system: string;
            };
            severityOptions: {
              low: string;
              medium: string;
              high: string;
              critical: string;
            };
            environmentOptions: {
              local: string;
              development: string;
              staging: string;
              production: string;
            };
            form: {
              type: string;
              module: string;
              action: string;
              user_name: string;
              user_type: string;
              severity: string;
              environment: string;
              ip_address: string;
              start_date: string;
              end_date: string;
              keyword: string;
            };
            startDate: string;
            endDate: string;
            dateRange: string;
            keyword: string;
            stats: {
              title: string;
              total: string;
              today: string;
              byType: string;
              bySeverity: string;
              byModule: string;
            };
            export: string;
            exportSuccess: string;
            exportFailed: string;
          };

          systemConfig: {
            title: string;
            key: string;
            value: string;
            type: string;
            addConfig: string;
            public: string;
            editConfig: string;
            form: {
              key: string;
              value: string;
              type: string;
              public: string;
            };
          };
          uploadFile: {
            title: string;
            type: string;
            local: string;
            qiniu: string;
            aliyun: string;
            uploadPath: string;
            qn_bucket: string;
            qn_accessKey: string;
            qn_secretKey: string;
            qn_zone: string;
            qn_endPoint: string;
            oss_bucket: string;
            oss_accessKey: string;
            oss_secretKey: string;
            oss_region: string;
            oss_endPoint: string;
            oss_apiVersion: string;
            form: {
              uploadPath: string;
              qn_bucket: string;
              qn_accessKey: string;
              qn_secretKey: string;
              qn_zone: string;
              qn_endPoint: string;
              oss_bucket: string;
              oss_accessKey: string;
              oss_secretKey: string;
              oss_region: string;
              oss_endPoint: string;
              oss_apiVersion: string;
            };
          };
        };
        document: {
          contentCategory: {
            title: string;
            add: string;
            addSub: string;
            edit: string;
            name: string;
            parentName: string;
            enable: string;
            type: string;
            typeNormal: string;
            typeSinger: string;
            icon: string;
            cover: string;
            template: string;
            seoUrl: string;
            sort: string;
            keywords: string;
            description: string;
            nameRequired: string;
            nameLength: string;
            seoUrlRequired: string;
            descriptionRequired: string;
            descriptionLength: string;
            imageTypeError: string;
            imageSizeError: string;
            form: {
              icon: string;
            };
          };
          ads: {
            title: string;
            name: string;
            type: string;
            type_image: string;
            type_text: string;
            state: string;
            carousel: string;
            height: string;
            comments: string;
            items: string;
            item: string;
            link: string;
            alt: string;
            target: string;
            image: string;
            copyCode: string;
            typeOptions: {
              image: string;
              text: string;
            };
          };
          content: {
            title: string;
            mainTitle: string;
            subTitle: string;
            category: string;
            tags: string;
            type: string;
            author: string;
            publishDate: string;
            state: string;
            draft: string;
            clickNum: string;
            commentNum: string;
            pendingReview: string;
            approved: string;
            offline: string;
            addContent: string;
            editContent: string;
            batchChangeCategory: string;
            selectCover: string;
            recyclebin: string;
            selectContentFirst: string;
            selectCoverFirst: string;
            selectCategory: string;
            selectedContent: string;
            items: string;
            keywords: string;
            coverImage: string;
            uploadCover: string;
            description: string;
            content: string;
            comments: string;
            source: string;
            isTop: string;
            isPublished: string;
            isPinned: string;
            hideForm: string;
            batchRestore: string;
            restore: string;
            confirmRestore: string;
            operateSuccess: string;
            form: {
              imageFormatError: string;
              imageSizeError: string;
              contentPlaceholder: string;
              keywordsSeparator: string;
            };
          };
          contentMessage: {
            title: string;
            userSaid: string;
            content: string;
            author: string;
            replyAuthor: string;
            auditStatus: string;
            praiseNum: string;
            despiseNum: string;
            createdAt: string;
            form: {
              searchContent: string;
              selectAuditStatus: string;
            };
            reply: string;
            replyUser: string;
            stitle: string;
            auditStatusOptions: {
              pending: string;
              approved: string;
              rejected: string;
            };
          };
        };
        member: {
          regUser: {
            title: string;
            userName: string;
            phone: string;
            email: string;
            role: string;
            status: string;
            registerTime: string;
            comments: string;
            editUser: string;
            normalUser: string;
            adminUser: string;
          };
        };
        email: {
          mailTemplate: {
            title: string;
            type: string;
            comment: string;
            templateTitle: string;
            subTitle: string;
            content: string;
            createdAt: string;
            tags: string;
            form: {
              type: string;
              comment: string;
              title: string;
              subTitle: string;
              content: string;
            };
            addTemplate: string;
            editTemplate: string;
            commonTags: string;
            passwordRecoveryTags: string;
            messageTags: string;
            verificationTags: string;
            tag: {
              siteName: string;
              siteDomain: string;
              email: string;
              passwordToken: string;
              messageAuthor: string;
              messageSendDate: string;
              messageContentTitle: string;
              messageContentId: string;
              verificationCode: string;
            };
          };
        };
        extend: {
          templateConfig: {
            title: string;
            templateMarket: string;
            installedTemplates: string;
            uploadTemplate: string;
            author: string;
            version: string;
            introduction: string;
            price: string;
            free: string;
            action: string;
            install: string;
            preview: string;
            enable: string;
            uninstall: string;
            update: string;
            currentTheme: string;
            systemTemplate: string;
            templateConfig: string;
            addTemplateItem: string;
            form: {
              name: string;
              alias: string;
              template: string;
              comments: string;
              installSuccessMsg: string;
              uninstallSuccessMsg: string;
              enableSuccessMsg: string;
              updateSuccessMsg: string;
              uploadSuccessMsg: string;
              uploadFailMsg: string;
              limitFileType: string;
              limitFileSize: string;
              operationInProgress: string;
              installInProgress: string;
              updateInProgress: string;
              enableInProgress: string;
              uninstallInProgress: string;
              processing: string;
            };
            downloadExample: string;
            paymentTitle: string;
            selectTemplate: string;
            templateItems: string;
          };
          plugin: {
            title: string;
            installedTitle: string;
            shopTitle: string;
            name: string;
            description: string;
            version: string;
            hooks: string;
            amount: string;
            state: string;
            install: string;
            uninstall: string;
            update: string;
            installed: string;
            notInstalled: string;
            enable: string;
            createdAt: string;
            updatedAt: string;
            free: string;
            installNotice: string;
            uninstallNotice: string;
            updateNotice: string;
            buyConfirm: string;
            scanToPay: string;
            pluginDetail: string;
            form: {
              name: string;
              description: string;
            };
          };
        };
      };
      form: {
        required: string;
        userName: FormMsg;
        phone: FormMsg;
        pwd: FormMsg;
        confirmPwd: FormMsg;
        code: FormMsg;
        email: FormMsg;
      };
      dropdown: Record<Global.DropdownKey, string>;
      icon: {
        themeConfig: string;
        themeSchema: string;
        lang: string;
        fullscreen: string;
        fullscreenExit: string;
        reload: string;
        collapse: string;
        expand: string;
        pin: string;
        unpin: string;
        searchIcon: string;
        clickToSelectIcon: string;
        noResultFound: string;
      };
      datatable: {
        itemCount: string;
      };
    };

    type GetI18nKey<T extends Record<string, unknown>, K extends keyof T = keyof T> = K extends string
      ? T[K] extends Record<string, unknown>
        ? `${K}.${GetI18nKey<T[K]>}`
        : K
      : never;

    type I18nKey = GetI18nKey<Schema>;

    type TranslateOptions<Locales extends string> = import('vue-i18n').TranslateOptions<Locales>;

    interface $T {
      (key: I18nKey): string;
      (key: I18nKey, plural: number, options?: TranslateOptions<LangType>): string;
      (key: I18nKey, defaultMsg: string, options?: TranslateOptions<I18nKey>): string;
      (key: I18nKey, list: unknown[], options?: TranslateOptions<I18nKey>): string;
      (key: I18nKey, list: unknown[], plural: number): string;
      (key: I18nKey, list: unknown[], defaultMsg: string): string;
      (key: I18nKey, named: Record<string, unknown>, options?: TranslateOptions<LangType>): string;
      (key: I18nKey, named: Record<string, unknown>, plural: number): string;
      (key: I18nKey, named: Record<string, unknown>, defaultMsg: string): string;
    }
  }

  /** Service namespace */
  namespace Service {
    /** Other baseURL key */
    type OtherBaseURLKey = 'demo';

    interface ServiceConfigItem {
      /** The backend service base url */
      baseURL: string;
      /** The proxy pattern of the backend service base url */
      proxyPattern: string;
    }

    interface OtherServiceConfigItem extends ServiceConfigItem {
      key: OtherBaseURLKey;
    }

    /** The backend service config */
    interface ServiceConfig extends ServiceConfigItem {
      /** Other backend service config */
      other: OtherServiceConfigItem[];
    }

    interface SimpleServiceConfig extends Pick<ServiceConfigItem, 'baseURL'> {
      other: Record<OtherBaseURLKey, string>;
    }

    /** The backend service response data */
    type Response<T = unknown> = {
      /** The backend service response code */
      status: string;
      /** The backend service response code */
      code: string;
      /** The backend service response message */
      msg: string;
      /** The backend service response data */
      data: T;
    };

    /** The demo backend service response data */
    type DemoResponse<T = unknown> = {
      /** The backend service response code */
      status: string;
      /** The backend service response message */
      message: string;
      /** The backend service response data */
      result: T;
      data?: T;
    };
  }
}
