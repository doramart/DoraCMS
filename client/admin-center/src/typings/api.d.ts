/**
 * Namespace Api
 *
 * All backend api type definitions
 */
declare namespace Api {
  /** Common types used across different modules */
  namespace Common {
    /** Common pagination parameters */
    interface PaginatingCommonParams {
      /** current page number */
      current: number;
      /** page size */
      pageSize: number;
      /** total count */
      total: number;
      /** whether to enable paging */
      isPaging?: string;
    }

    /** Common pagination response type */
    interface PaginatingQueryRecord<T = any> extends PaginatingCommonParams {
      records?: T[];
      data?: T[];
      docs?: T[];
      pageInfo?: any;
    }

    /** Common search parameters for tables */
    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'pageSize'>;

    /** Common page info structure */
    interface PageInfo {
      totalItems: number;
      pageSize: number;
      current: number;
      searchkey?: string;
      totalPage: number;
    }

    /** Common list response structure */
    interface ListResponse<T> {
      docs: T[];
      pageInfo: PageInfo;
    }

    /** Common search params with keyword */
    interface SearchParamsWithKeyword extends CommonSearchParams {
      searchkey?: string;
    }

    /** Common record fields */
    interface CommonRecordFields {
      /** record id */
      id?: string;
      id?: string;
      /** record creator */
      createBy?: string;
      /** record create time */
      createdAt?: string;
      /** record updater */
      updateBy?: string;
      /** record update time */
      updatedAt?: string;
      /** record status */
      status?: EnableStatus | undefined;
    }

    /** Common record type */
    type CommonRecord<T = any> = CommonRecordFields & T;

    /**
     * enable status
     *
     * - "1": enabled
     * - "2": disabled
     */
    type EnableStatus = '1' | '2';
  }

  /** Authentication related types Handles user authentication, login, and user information */
  namespace Auth {
    interface LoginToken {
      token: string;
      refreshToken: string;
    }

    interface UserInfo {
      id?: string;
      userId: string;
      userName: string;
      roles: string[];
      buttons: string[];
    }

    interface InitStatus {
      needInit: boolean;
    }

    interface InitAdminParams {
      userName: string;
      nickName: string;
      userEmail: string;
      password: string;
      userPhone?: string;
      userGender?: Api.SystemManage.UserGender;
    }
  }

  /** Route related types Handles menu routes and user route permissions */
  namespace Route {
    type ElegantConstRoute = import('@elegant-router/types').ElegantConstRoute;

    interface MenuRoute extends ElegantConstRoute {
      id: string;
    }

    interface UserRoute {
      routes: MenuRoute[];
      home: import('@elegant-router/types').LastLevelRouteKey;
    }
  }

  /** System management related types Handles roles, users, menus, and system configurations */
  namespace SystemManage {
    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'pageSize' | 'isPaging'>;

    /** Role related types */
    type Role = Common.CommonRecord<{
      /** role name */
      roleName: string;
      /** role code */
      roleCode: string;
      /** role description */
      roleDesc: string;
    }>;

    /** role search params */
    type RoleSearchParams = CommonType.RecordNullable<
      Pick<Api.SystemManage.Role, 'roleName' | 'roleCode' | 'status'> & CommonSearchParams
    >;

    /** role list */
    type RoleList = Common.PaginatingQueryRecord<Role>;

    /** all role */
    type AllRole = Pick<Role, 'id' | 'roleName' | 'roleCode'>;

    /**
     * user gender
     *
     * - "1": "male"
     * - "2": "female"
     */
    type UserGender = '1' | '2';

    /** user */
    type User = Common.CommonRecord<{
      /** user name */
      userName: string;
      /** user password */
      password: string;
      /** user gender */
      userGender: UserGender | undefined;
      /** user nick name */
      nickName: string;
      /** user status */
      status: UserStatus | undefined;
      /** user phone */
      userPhone: string;
      /** user email */
      userEmail: string;
      /** user role code collection */
      userRoles: string[];
      /** user avatar logo */
      logo?: string;
    }>;

    /** user search params */
    type UserSearchParams = CommonType.RecordNullable<
      Pick<Api.SystemManage.User, 'userName' | 'userGender' | 'nickName' | 'userPhone' | 'userEmail' | 'status'> &
        CommonSearchParams
    >;

    /** user list */
    type UserList = Common.PaginatingQueryRecord<User>;

    /**
     * menu type
     *
     * - "1": directory
     * - "2": menu
     */
    type MenuType = '1' | '2';

    type MenuButton = {
      /** button description */
      desc: string;
      /** button api */
      api?: string;
      /** permission code binding */
      permissionCode: string;
      /** http method */
      httpMethod?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    };

    /**
     * icon type
     *
     * - "1": iconify icon
     * - "2": local icon
     */
    type IconType = '1' | '2';

    type MenuPropsOfRoute = Pick<
      import('vue-router').RouteMeta,
      | 'i18nKey'
      | 'keepAlive'
      | 'constant'
      | 'order'
      | 'href'
      | 'hideInMenu'
      | 'activeMenu'
      | 'multiTab'
      | 'fixedIndexInTab'
      | 'query'
    >;

    type Menu = Common.CommonRecord<{
      id: string;
      /** parent menu id */
      parentId: string;
      /** menu type */
      menuType: MenuType;
      /** menu name */
      menuName: string;
      /** route name */
      routeName: string;
      /** route path */
      routePath: string;
      /** component */
      component?: string;
      /** iconify icon name or local icon name */
      icon: string;
      /** icon type */
      iconType: IconType;
      /** buttons */
      buttons?: MenuButton[] | null;
      /** children menu */
      children?: Menu[] | null;
    }> &
      MenuPropsOfRoute;

    /** menu list */
    type MenuList = Common.PaginatingQueryRecord<Menu>;

    type MenuTree = {
      id: number;
      label: string;
      pId: number;
      children?: MenuTree[];
    };

    /** content tag */
    type ContentTag = {
      id?: string;
      id: string;
      /** tag name */
      name: string;
      /** tag description */
      comments: string;
    } & Partial<Common.CommonRecord>;

    /** content tag search params */
    type ContentTagSearchParams = CommonType.RecordNullable<
      {
        /** search keyword */
        pageSize: number;
        searchkey: string;
      } & CommonSearchParams
    >;

    /** content tag list */
    type ContentTagList = Common.PaginatingQueryRecord<ContentTag>;

    /** content category */
    type ContentCategory = Common.CommonRecord<{
      id?: string;
      id: string;
      /** category name */
      name: string;
      /** category description */
      comments: string;
      /** category keywords */
      keywords: string;
      /** category type */
      type: string;
      /** sort id */
      sortId?: number;
      /** parent id */
      parentId: string;
      /** enable status */
      enable: boolean;
      /** default url */
      defaultUrl?: string;
      /** home page */
      homePage?: string;
      /** sort path */
      sortPath?: string;
      /** content template */
      contentTemp?: string;
      /** small image */
      sImg?: string;
      /** category icon */
      icon?: string;
      /** url */
      url?: string;
    }>;

    /** content category search params */
    type ContentCategorySearchParams = CommonType.RecordNullable<
      {
        /** search keyword */
        searchkey: string;
      } & CommonSearchParams
    >;

    /** content category list */
    type ContentCategoryList = Common.PaginatingQueryRecord<ContentCategory>;

    /** template item */
    type TemplateItem = {
      forder: string;
      cateName: string;
      detailName: string;
      isDefault: boolean;
      id: string;
      name: string;
      createdAt: string;
      comment?: string;
      __v: number;
    };

    /** template */
    type Template = {
      alias: string;
      version: string[];
      items: TemplateItem[];
      sImg: string;
      author: string;
      using: boolean;
      id: string;
      name: string;
      comment: string;
      createdAt: string;
      __v: number;
    };

    /** template list */
    type TemplateList = Template[];

    /** System option log */
    interface SystemOptionLog {
      /** Log ID */
      id: string;
      /** Log type: login|logout|exception|operation|access|error|warning|info|debug */
      type: 'login' | 'logout' | 'exception' | 'operation' | 'access' | 'error' | 'warning' | 'info' | 'debug';
      /** Log content */
      logs: string;
      /** Request path */
      request_path?: string;
      /** Request method */
      request_method?: string;
      /** Request params */
      request_params?: Record<string, any>;
      /** Request body */
      request_body?: Record<string, any>;
      /** Request query */
      request_query?: Record<string, any>;
      /** User ID */
      user_id?: string;
      /** User name */
      user_name?: string;
      /** User type: admin|user|guest|system */
      user_type?: 'admin' | 'user' | 'guest' | 'system';
      /** Session ID */
      session_id?: string;
      /** IP address */
      ip_address?: string;
      /** User agent */
      user_agent?: string;
      /** Client platform */
      client_platform?: string;
      /** Client version */
      client_version?: string;
      /** Response status */
      response_status?: number;
      /** Response time (ms) */
      response_time?: number;
      /** Response size (bytes) */
      response_size?: number;
      /** Module: admin|user|content|role|system_config etc. */
      module?: string;
      /** Action: create|update|delete|register etc. */
      action?: string;
      /** Resource type */
      resource_type?: string;
      /** Resource ID */
      resource_id?: string;
      /** Old value (JSON string) */
      old_value?: string;
      /** New value (JSON string) */
      new_value?: string;
      /** Error message */
      error_message?: string;
      /** Error code */
      error_code?: string;
      /** Error stack */
      error_stack?: string;
      /** Is handled */
      is_handled?: boolean;
      /** Tags */
      tags?: string[];
      /** Severity: low|medium|high|critical */
      severity?: 'low' | 'medium' | 'high' | 'critical';
      /** Environment: local|development|staging|production */
      environment?: 'local' | 'development' | 'staging' | 'production';
      /** Trace ID */
      trace_id?: string;
      /** Extra data */
      extra_data?: Record<string, any>;
      /** Created at */
      createdAt: string;
      /** Updated at */
      updatedAt?: string;
    }

    interface SystemOptionLogSearchParams {
      /** Current page */
      current?: number;
      /** Page size */
      size?: number;
      /** Log type */
      type?: string;
      /** Module */
      module?: string;
      /** Action */
      action?: string;
      /** User name */
      user_name?: string;
      /** User type */
      user_type?: string;
      /** Severity */
      severity?: string;
      /** Environment */
      environment?: string;
      /** IP address */
      ip_address?: string;
      /** Start date */
      start_date?: string;
      /** End date */
      end_date?: string;
      /** Keyword search */
      keyword?: string;
    }

    interface SystemConfig {
      id: string;
      key: string;
      value: string | number | boolean | any;
      public: boolean;
      type: 'string' | 'number' | 'boolean' | 'password';
    }

    interface SystemConfigList {
      docs: SystemConfig[];
      pageInfo: Common.PageInfo;
    }

    /** Upload configuration */
    interface UploadConfig {
      id?: string;
      type: 'local' | 'qn' | 'oss';
      uploadPath?: string;
      qn_bucket?: string;
      qn_accessKey?: string;
      qn_secretKey?: string;
      qn_zone?: string;
      qn_endPoint?: string;
      oss_bucket?: string;
      oss_accessKey?: string;
      oss_secretKey?: string;
      oss_region?: string;
      oss_endPoint?: string;
      oss_apiVersion?: string;
      createdAt?: string;
      updatedAt?: string;
    }

    /** Backup data configuration */
    /** Backup data item */
    interface BackupItem {
      id: string;
      id: string;
      logs: string;
      path: string;
      fileName: string;
      createdAt: string;
      __v: number;
    }

    /** Get list params */
    interface GetListParams {
      pageSize?: number;
      current?: number;
      searchkey?: string;
    }

    /** Get list result */
    interface GetListResult {
      docs: BackupItem[];
      pageInfo: Common.PageInfo;
    }

    /** Registered user */
    interface RegUser {
      id: string;
      userName: string;
      phoneNum?: string;
      email?: string;
      enable: boolean;
      comments?: string;
      group: string;
      createdAt: string;
      logo?: string;
      idType?: string;
      introduction?: string;
      birth?: string;
      gender?: string;
      state?: string;
      loginActive?: boolean;
    }

    /** Registered user list result */
    interface RegUserListResult {
      docs: RegUser[];
      pageInfo: Common.PageInfo & {
        state?: string;
      };
    }
  }

  /** Email management related types Handles email templates, delivery tasks, and send logs */
  namespace Email {
    /** Mail delivery template type */
    type MailTemplateType = '0' | '6' | '8' | undefined; // 0: reset password, 6: comment notification, 8: email verification code

    /** Mail template item */
    interface MailTemplate {
      id: string;
      comment: string;
      title: string;
      subTitle: string;
      content: string;
      type: MailTemplateType;
      createdAt: string;
      updatedAt: string;
      id: string;
    }



    /** Mail template list response */
    interface MailTemplateList {
      docs: MailTemplate[];
      pageInfo: Common.PageInfo;
    }

  }

  /** Document management related types Handles advertisements and content messages */
  namespace DocumentManage {
    /** Advertisement item */
    interface AdItem {
      height: number | null;
      target: string;
      id: string;
      title: string;
      link: string;
      width: number | null;
      alt: string;
      sImg: string;
      createdAt: string;
      __v: number;
      id: string;
      appLinkType?: string;
    }

    /** Advertisement */
    interface Advertisement {
      type: string;
      carousel: boolean;
      state: boolean;
      height: number | null;
      items: AdItem[];
      id: string;
      name: string;
      comments: string;
      createdAt: string;
      __v: number;
      id: string;
    }

    /** Advertisement list */
    type AdList = Common.PaginatingQueryRecord<Advertisement>;

    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'pageSize'> & {
      searchkey?: string;
    };

    /** content message author */
    interface ContentMessageAuthor {
      id: string;
      userName: string;
      enable: boolean;
      logo: string;
      createdAt: string;
      id: string;
    }

    /** content message content id */
    interface ContentMessageContentId {
      id: string;
      title: string;
      stitle: string;
      url: string;
      id: string;
    }

    /** content message */
    interface ContentMessage {
      id: string;
      id?: string;
      state: boolean;
      utype: string;
      praise_num: number;
      had_praise: boolean;
      content: string;
      contentId: ContentMessageContentId;
      replyAuthor: ContentMessageAuthor | null;
      adminReplyAuthor: ContentMessageAuthor | null;
      author: ContentMessageAuthor;
      relationMsgId: string;
      createdAt: string;
      __v: number;
    }

    /** content message reply params */
    interface ContentMessageReply {
      relationMsgId: string;
      contentId: string;
      utype: string;
      replyAuthor?: string;
      adminReplyAuthor?: string;
      content: string;
    }

    /** content message search params */
    type ContentMessageSearchParams = CommonSearchParams;

    /** content message list */
    interface ContentMessageList {
      docs: ContentMessage[];
      pageInfo: Common.PageInfo;
    }

    interface ContentMessageStats {
      total: number;
      normal: number;
      reported: number;
    }

    /** Content type */
    interface Content {
      /** Content ID */
      id: string;
      /** Content title */
      title: string;
      /** Content subtitle */
      stitle: string;
      /** Content type */
      type: string;
      /** Content categories */
      categories: string[];
      /** Content tags */
      tags: string[];
      /** Content keywords */
      keywords: string;
      /** Content cover image */
      sImg: string;
      /** Content description */
      discription: string;
      /** Content body */
      content: string;
      /** Content comments */
      comments: string;
      /** Whether content is top */
      isTop: boolean;
      /** Content click count */
      clickNum: number;
      /** Content state (0: Draft, 1: Pending Review, 2: Approved, 3: Offline) */
      state: string;
      /** Content author */
      author: string;
      /** Content source */
      from: string;
      /** Content like count */
      likeNum: number;
      /** Whether content is pinned */
      roofPlacement: boolean;
      /** Content update date */
      updatedAt: string;
    }
  }

  /** Plugin management related types Handles templates, plugins, and plugin marketplace */
  namespace PluginManage {
    interface Template {
      id: string;
      id?: string;
      alias: string;
      version: string[];
      items: TemplateConfigItem[];
      sImg: string;
      author: string;
      using: boolean;
      name: string;
      comment?: string;
      date?: string;
      __v?: number;
      shoudUpdate?: boolean;
    }

    interface TemplateStats {
      total: number;
      active: number;
      installed: number;
      totalDownloads: number;
      avgRating: number;
    }

    interface TemplateConfigItem {
      id: string;
      forder: string;
      cateName: string;
      detailName: string;
      isDefault: boolean;
      name: string;
      createdAt: string;
      __v?: number;
      comment?: string;
    }

    interface TemplateItem {
      name: string;
      type: string;
      size: number;
      createdAt: string;
    }

    interface TemplateMarketItem {
      id: string;
      id?: string;
      name: string;
      alias: string;
      sImg: string;
      buy_tips: string;
      author: string;
      comment: string;
      preview?: any;
      createdAt: string;
      updatedAt?: string;
      version: string[];
      from: string;
      amount: number;
      discount_amount: number | null;
      state: string;
      downloadNum: number;
    }

    interface TemplateShopResponse {
      docs: TemplateMarketItem[];
      pageInfo: Common.PageInfo & {
        from: string;
      };
    }

    interface TemplateItemAdd {
      name: string;
      alias?: string;
      comments: string;
      forder: string;
      temp_id?: string;
    }

    interface TemplateSearchParams {
      current?: number;
      pageSize?: number;
    }

    /** Plugin search params */
    type PluginSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'pageSize'> & {
      name?: string;
      description?: string;
    };

    /** Plugin API */
    interface PluginApi {
      /** API url */
      url: string;
      /** API method */
      method: string;
      /** Controller name */
      controllerName: string;
      /** API details */
      details: string;
      /** No power flag */
      noPower?: boolean;
    }

    /** Plugin */
    interface Plugin {
      /** Plugin ID */
      id: string;
      /** Plugin alias */
      alias: string;
      /** Package name */
      pkgName: string;
      /** English name */
      enName: string;
      /** Plugin name */
      name: string;
      /** Plugin description */
      description: string;
      /** Plugin version */
      version: string;
      /** Plugin icon name */
      iconName: string;
      /** Admin URL */
      adminUrl: string;
      /** Plugin state */
      state?: boolean;
      /** Amount */
      amount: number;
      /** Is admin */
      isadm: string;
      /** Is index */
      isindex: string;
      /** Auth user */
      authUser?: boolean;
      /** Hooks */
      hooks?: string[];
      /** Plugin type */
      type: string;
      /** Admin API */
      adminApi: PluginApi[];
      /** Font API */
      fontApi: PluginApi[];
      /** Create time */
      createdAt: string;
      /** Update time */
      updatedAt?: string;
      /** Operation instructions */
      operationInstructions?: string;
      /** Plugin ID */
      pluginId?: string;
      /** Installor */
      installor?: string;
      /** Should update */
      shouldUpdate?: boolean;
      /** Installed flag */
      installed?: boolean;
      /** Init data */
      initData?: string;
      /** Plugin config */
      pluginsConfig?: string;
      /** Default config */
      defaultConfig?: string;
      /** ID */
      id?: string;
    }

    /** Plugin list */
    interface PluginList {
      docs: Plugin[];
      pageInfo: Common.PageInfo;
    }

    /** Invoice */
    interface Invoice {
      /** QR code */
      qrCode: string;
      /** Invoice number */
      noInvoice: string;
    }

    /** Invoice check result */
    interface InvoiceCheckResult {
      /** Check state */
      checkState: boolean;
    }
  }

  namespace Ops {
    interface CacheTemplateStats {
      hits: number;
      misses: number;
      errors: number;
      totalRequests: number;
      avgResponseTime: number;
      hitRate: string;
      uptime: number;
      memoryUsage?: Record<string, number>;
      cacheConfig?: Record<string, any>;
      systemCacheInfo?: Record<string, any>;
    }

    interface CacheHealthRecommendation {
      type: string;
      message: string;
      action: string;
    }

    interface CacheHealth {
      score: number;
      status: string;
      recommendations: CacheHealthRecommendation[];
    }

    interface CacheStats {
      template: CacheTemplateStats;
      health: CacheHealth;
      timestamp: number;
    }

    interface SitemapStatus {
      cache: Record<string, any>;
      statistics: {
        categories: number;
        contents: number;
        totalUrls: number;
        lastGenerated: string;
      };
      config: {
        siteDomain: string;
        autoRefresh: boolean;
        cacheEnabled: boolean;
        cacheExpire: number;
      };
      health: {
        status: string;
        lastCheck: string;
      };
    }
  }

  namespace Notice {
    interface ClientNotice {
      id: string;
      title: string;
      content: string;
      type?: string;
      sender?: string;
      createTime?: string;
      updateTime?: string;
      icon?: string;
    }

    interface ClientNoticeSearchParams {
      current?: number;
      pageSize?: number;
      type?: string;
      searchkey?: string;
    }
  }
}
