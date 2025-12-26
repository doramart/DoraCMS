/**
 * Repository 异常工具类
 * 提供统一的异常创建方法，避免重复引用
 */
'use strict';

const { ErrorFactory } = require('../../exceptions');

/**
 * Repository 异常管理器
 * 封装常见的业务异常创建方法
 */
class RepositoryExceptions {
  /**
   * 用户相关异常
   */
  static user = {
    // 唯一性约束异常
    nameExists: value => ErrorFactory.uniqueConstraint('userName', value, '用户名已存在'),
    emailExists: value => ErrorFactory.uniqueConstraint('email', value, '邮箱已存在'),
    phoneExists: value => ErrorFactory.uniqueConstraint('phoneNum', value, '手机号已存在'),

    // 资源未找到异常
    notFound: id => ErrorFactory.notFound('用户', id),

    // 验证异常
    nameRequired: () => ErrorFactory.validation('用户名不能为空'),
    emailRequired: () => ErrorFactory.validation('邮箱不能为空'),
    phoneRequired: () => ErrorFactory.validation('手机号不能为空'),
    passwordRequired: () => ErrorFactory.validation('密码不能为空'),
    nameTooLong: maxLength => ErrorFactory.validation(`用户名长度不能超过${maxLength}个字符`),
    emailInvalid: email => ErrorFactory.validation(`邮箱格式不正确: ${email}`),
    phoneInvalid: phone => ErrorFactory.validation(`手机号格式不正确: ${phone}`),
    passwordTooShort: minLength => ErrorFactory.validation(`密码长度不能少于${minLength}个字符`),

    // 业务规则异常
    disabled: () => ErrorFactory.businessRule('USER_DISABLED', '用户已被禁用'),
    deleted: () => ErrorFactory.businessRule('USER_DELETED', '用户已被删除'),
    invalidCredentials: () => ErrorFactory.authentication('用户名或密码错误'),
    loginFailed: () => ErrorFactory.authentication('登录失败，请检查用户名和密码'),
    accountLocked: () => ErrorFactory.businessRule('ACCOUNT_LOCKED', '账户已被锁定'),

    // 列表操作异常
    listOperationFailed: (operation, listType) =>
      ErrorFactory.businessRule('LIST_OPERATION_FAILED', `${operation}${listType}失败`),
    alreadyInList: (listType, targetId) =>
      ErrorFactory.businessRule('ALREADY_IN_LIST', `目标 ${targetId} 已在${listType}中`),
    notInList: (listType, targetId) => ErrorFactory.businessRule('NOT_IN_LIST', `目标 ${targetId} 不在${listType}中`),
  };

  /**
   * 认证相关异常
   */
  static auth = {
    sessionExpired: () => ErrorFactory.authentication('用户未登录或会话已过期'),
    invalidToken: () => ErrorFactory.authentication('无效的访问令牌'),
    loginRequired: () => ErrorFactory.authentication('请先登录'),
  };

  /**
   * 权限相关异常
   */
  static permission = {
    denied: (resource, action) => ErrorFactory.permission('权限不足', resource, action),
    resourceAccess: resource => ErrorFactory.permission(`无权访问${resource}`),
    actionForbidden: action => ErrorFactory.permission(`无权执行${action}操作`),
  };

  /**
   * 业务规则异常
   */
  static business = {
    statusConflict: message => ErrorFactory.businessRule('STATUS_CONFLICT', message),
    dataConflict: message => ErrorFactory.dataConsistency(message),
    operationNotAllowed: message => ErrorFactory.businessRule('OPERATION_NOT_ALLOWED', message),
  };

  /**
   * 资源相关异常
   */
  static resource = {
    notFound: (resourceName, id) => ErrorFactory.notFound(resourceName, id),
    alreadyExists: (resourceName, field, value) => ErrorFactory.uniqueConstraint(field, value, `${resourceName}已存在`),
  };

  /**
   * 菜单相关异常
   */
  static menu = {
    routePathExists: value => ErrorFactory.uniqueConstraint('routePath', value, '路由路径已存在'),
    routeNameExists: value => ErrorFactory.uniqueConstraint('routeName', value, '路由名称已存在'),
    permissionCodeExists: value => ErrorFactory.uniqueConstraint('permissionCode', value, '权限标识已存在'),
    invalidMenuType: value => ErrorFactory.validation(`无效的菜单类型: ${value}`),
    parentNotFound: parentId => ErrorFactory.notFound('父菜单', parentId),
    circularReference: () => ErrorFactory.businessRule('CIRCULAR_REFERENCE', '菜单存在循环引用'),
    hasChildren: menuId => ErrorFactory.businessRule('HAS_CHILDREN', `菜单 ${menuId} 存在子菜单，无法删除`),
  };

  /**
   * 角色相关异常
   */
  static role = {
    codeExists: value => ErrorFactory.uniqueConstraint('roleCode', value, '角色代码已存在'),
    nameExists: value => ErrorFactory.uniqueConstraint('roleName', value, '角色名称已存在'),
    notFound: id => ErrorFactory.notFound('角色', id),
    inUse: roleId => ErrorFactory.businessRule('ROLE_IN_USE', `角色 ${roleId} 正在被使用，无法删除`),
    invalidStatus: value => ErrorFactory.validation(`无效的角色状态: ${value}`),
    permissionConflict: message => ErrorFactory.businessRule('PERMISSION_CONFLICT', message),
  };

  /**
   * 系统配置相关异常
   */
  static systemConfig = {
    keyExists: value => ErrorFactory.uniqueConstraint('key', value, '配置键已存在'),
    keyNotFound: key => ErrorFactory.notFound('配置键', key),
    invalidType: value => ErrorFactory.validation(`无效的配置类型: ${value}`),
    invalidValue: (type, value) => ErrorFactory.validation(`配置值 "${value}" 不符合类型 "${type}" 的要求`),
    passwordTooShort: () => ErrorFactory.validation('密码长度至少6位'),
    readOnlyConfig: key => ErrorFactory.businessRule('READ_ONLY_CONFIG', `配置 ${key} 为只读配置，不允许修改`),
    systemConfigRequired: key =>
      ErrorFactory.businessRule('SYSTEM_CONFIG_REQUIRED', `系统配置 ${key} 为必需配置，不允许删除`),
  };

  /**
   * 内容标签相关异常
   */
  static contentTag = {
    nameExists: value => ErrorFactory.uniqueConstraint('name', value, '标签名称已存在'),
    aliasExists: value => ErrorFactory.uniqueConstraint('alias', value, '标签别名已存在'),
    notFound: id => ErrorFactory.notFound('标签', id),
    invalidStatus: value => ErrorFactory.validation(`无效的标签状态: ${value}`),
    inUse: tagId => ErrorFactory.businessRule('TAG_IN_USE', `标签 ${tagId} 正在被使用，无法删除`),
    nameRequired: () => ErrorFactory.validation('标签名称不能为空'),
    nameTooLong: maxLength => ErrorFactory.validation(`标签名称长度不能超过${maxLength}个字符`),
    aliasTooLong: maxLength => ErrorFactory.validation(`标签别名长度不能超过${maxLength}个字符`),
    invalidAlias: alias => ErrorFactory.validation(`标签别名 "${alias}" 格式不正确，只能包含字母、数字和连字符`),
    duplicateInBatch: names =>
      ErrorFactory.businessRule('DUPLICATE_IN_BATCH', `批量操作中存在重复的标签名称: ${names.join(', ')}`),
  };

  /**
   * 内容分类相关异常
   */
  static contentCategory = {
    nameExists: value => ErrorFactory.uniqueConstraint('name', value, '分类名称已存在'),
    defaultUrlExists: value => ErrorFactory.uniqueConstraint('defaultUrl', value, '分类URL已存在'),
    notFound: id => ErrorFactory.notFound('分类', id),
    parentNotFound: parentId => ErrorFactory.notFound('父分类', parentId),
    invalidType: value => ErrorFactory.validation(`无效的分类类型: ${value}`),
    invalidStatus: value => ErrorFactory.validation(`无效的分类状态: ${value}`),
    hasChildren: categoryId => ErrorFactory.businessRule('HAS_CHILDREN', `分类 ${categoryId} 存在子分类，无法删除`),
    inUse: categoryId => ErrorFactory.businessRule('CATEGORY_IN_USE', `分类 ${categoryId} 正在被使用，无法删除`),
    circularReference: () => ErrorFactory.businessRule('CIRCULAR_REFERENCE', '分类存在循环引用'),
    nameRequired: () => ErrorFactory.validation('分类名称不能为空'),
    nameTooLong: maxLength => ErrorFactory.validation(`分类名称长度不能超过${maxLength}个字符`),
    urlTooLong: maxLength => ErrorFactory.validation(`分类URL长度不能超过${maxLength}个字符`),
    invalidUrl: url => ErrorFactory.validation(`分类URL "${url}" 格式不正确，只能包含字母、数字、连字符和斜杠`),
    invalidSortId: () => ErrorFactory.validation('排序值必须是正整数'),
    templateNotFound: templateId => ErrorFactory.notFound('内容模板', templateId),
    duplicateInBatch: names =>
      ErrorFactory.businessRule('DUPLICATE_IN_BATCH', `批量操作中存在重复的分类名称: ${names.join(', ')}`),
    pathTooDeep: maxDepth => ErrorFactory.businessRule('PATH_TOO_DEEP', `分类层级不能超过${maxDepth}级`),
  };

  /**
   * MailTemplate 邮件模板相关异常
   */
  static mailTemplate = {
    // 唯一性约束异常
    titleExists: value => ErrorFactory.uniqueConstraint('title', value, '模板标题已存在'),

    // 资源未找到异常
    notFound: id => ErrorFactory.notFound('邮件模板', id),

    // 验证异常
    titleRequired: () => ErrorFactory.validation('模板标题不能为空'),
    titleTooLong: maxLength => ErrorFactory.validation(`模板标题长度不能超过${maxLength}个字符`),
    contentRequired: () => ErrorFactory.validation('模板内容不能为空'),
    contentTooLong: maxLength => ErrorFactory.validation(`模板内容长度不能超过${maxLength}个字符`),
    invalidType: value => ErrorFactory.validation(`无效的模板类型: ${value}`),
    subTitleTooLong: maxLength => ErrorFactory.validation(`模板概要长度不能超过${maxLength}个字符`),
    commentTooLong: maxLength => ErrorFactory.validation(`模板备注长度不能超过${maxLength}个字符`),

    // 业务规则异常
    inUse: templateId => ErrorFactory.businessRule('TEMPLATE_IN_USE', `模板 ${templateId} 正在被使用，无法删除`),
    duplicateInBatch: titles =>
      ErrorFactory.businessRule('DUPLICATE_IN_BATCH', `批量操作中存在重复的模板标题: ${titles.join(', ')}`),
    templateNotEditable: templateId =>
      ErrorFactory.businessRule('TEMPLATE_NOT_EDITABLE', `模板 ${templateId} 为系统模板，不允许编辑`),
    templateNotDeletable: templateId =>
      ErrorFactory.businessRule('TEMPLATE_NOT_DELETABLE', `模板 ${templateId} 为系统模板，不允许删除`),
  };

  /**
   * UploadFile 文件上传配置相关异常
   */
  static uploadFile = {
    // 唯一性约束异常
    typeExists: value => ErrorFactory.uniqueConstraint('type', value, '上传类型配置已存在'),

    // 资源未找到异常
    notFound: id => ErrorFactory.notFound('上传配置', id),
    configNotFound: type => ErrorFactory.notFound('上传配置', `类型: ${type}`),

    // 验证异常
    typeRequired: () => ErrorFactory.validation('上传类型不能为空'),
    invalidType: type => ErrorFactory.validation(`无效的上传类型: ${type}，支持的类型: local, qn, oss`),
    uploadPathRequired: () => ErrorFactory.validation('本地上传路径不能为空'),
    uploadPathInvalid: path => ErrorFactory.validation(`无效的上传路径: ${path}`),

    // 七牛云配置验证
    qnBucketRequired: () => ErrorFactory.validation('七牛云存储空间名称不能为空'),
    qnAccessKeyRequired: () => ErrorFactory.validation('七牛云AccessKey不能为空'),
    qnSecretKeyRequired: () => ErrorFactory.validation('七牛云SecretKey不能为空'),
    qnZoneRequired: () => ErrorFactory.validation('七牛云存储区域不能为空'),
    qnEndPointRequired: () => ErrorFactory.validation('七牛云访问域名不能为空'),

    // 阿里云OSS配置验证
    ossBucketRequired: () => ErrorFactory.validation('阿里云OSS存储桶名称不能为空'),
    ossAccessKeyRequired: () => ErrorFactory.validation('阿里云OSS AccessKey不能为空'),
    ossSecretKeyRequired: () => ErrorFactory.validation('阿里云OSS SecretKey不能为空'),
    ossRegionRequired: () => ErrorFactory.validation('阿里云OSS地域不能为空'),
    ossEndPointRequired: () => ErrorFactory.validation('阿里云OSS访问域名不能为空'),

    // 业务规则异常
    configValidationFailed: (type, reason) =>
      ErrorFactory.businessRule('CONFIG_VALIDATION_FAILED', `${type}配置验证失败: ${reason}`),
    defaultConfigCannotDelete: () => ErrorFactory.businessRule('DEFAULT_CONFIG_CANNOT_DELETE', '默认上传配置不能删除'),
    configInUse: configId => ErrorFactory.businessRule('CONFIG_IN_USE', `上传配置 ${configId} 正在被使用，无法删除`),
    duplicateInBatch: types =>
      ErrorFactory.businessRule('DUPLICATE_IN_BATCH', `批量操作中存在重复的上传类型: ${types.join(', ')}`),
    invalidConfigData: message => ErrorFactory.validation(`配置数据无效: ${message}`),
  };

  /**
   * Content 内容相关异常
   */
  static content = {
    // 资源未找到异常
    notFound: id => ErrorFactory.notFound('内容', id),

    // 验证异常
    titleRequired: () => ErrorFactory.validation('内容标题不能为空'),
    titleTooLong: maxLength => ErrorFactory.validation(`内容标题长度不能超过${maxLength}个字符`),
    titleTooShort: minLength => ErrorFactory.validation(`内容标题长度不能少于${minLength}个字符`),
    authorRequired: () => ErrorFactory.validation('必须指定内容作者（管理员或普通用户）'),
    descriptionTooLong: maxLength => ErrorFactory.validation(`内容描述长度不能超过${maxLength}个字符`),
    contentTooLong: maxLength => ErrorFactory.validation(`内容正文长度不能超过${maxLength}个字符`),
    tagsRequired: () => ErrorFactory.validation('内容标签不能为空'),
    categoriesRequired: () => ErrorFactory.validation('内容分类不能为空'),
    invalidState: value => ErrorFactory.validation(`无效的内容状态: ${value}`),
    invalidType: value => ErrorFactory.validation(`无效的内容类型: ${value}`),
    invalidAppShowType: value => ErrorFactory.validation(`无效的APP显示类型: ${value}`),

    // 业务规则异常
    publishedCannotEdit: contentId =>
      ErrorFactory.businessRule('PUBLISHED_CANNOT_EDIT', `已发布的内容 ${contentId} 不能编辑`),
    archivedCannotEdit: contentId =>
      ErrorFactory.businessRule('ARCHIVED_CANNOT_EDIT', `已归档的内容 ${contentId} 不能编辑`),
    notOwner: (contentId, userId) =>
      ErrorFactory.businessRule('NOT_CONTENT_OWNER', `用户 ${userId} 不是内容 ${contentId} 的作者`),
    cannotDeletePublished: contentId =>
      ErrorFactory.businessRule('CANNOT_DELETE_PUBLISHED', `无法删除已发布的内容 ${contentId}`),
    exceedDailyLimit: (limit, current) =>
      ErrorFactory.businessRule('EXCEED_DAILY_LIMIT', `超过每日发布限制：当前 ${current}，限制 ${limit}`),
    invalidMedia: (type, reason) => ErrorFactory.businessRule('INVALID_MEDIA', `无效的媒体文件 ${type}: ${reason}`),
    duplicateSlug: slug => ErrorFactory.uniqueConstraint('slug', slug, '内容URL标识符已存在'),

    // 审核相关异常
    alreadyReviewed: contentId => ErrorFactory.businessRule('ALREADY_REVIEWED', `内容 ${contentId} 已经审核过了`),
    notPendingReview: contentId => ErrorFactory.businessRule('NOT_PENDING_REVIEW', `内容 ${contentId} 不在待审核状态`),
    reviewerRequired: () => ErrorFactory.validation('必须指定审核人'),
    dismissReasonRequired: () => ErrorFactory.validation('驳回内容时必须提供驳回原因'),

    // 权限相关异常
    noPublishPermission: () => ErrorFactory.permission('无权发布内容'),
    noEditPermission: contentId => ErrorFactory.permission(`无权编辑内容 ${contentId}`),
    noDeletePermission: contentId => ErrorFactory.permission(`无权删除内容 ${contentId}`),
    noReviewPermission: () => ErrorFactory.permission('无权审核内容'),

    // 关联关系异常
    categoryNotFound: categoryId => ErrorFactory.notFound('内容分类', categoryId),
    tagNotFound: tagId => ErrorFactory.notFound('内容标签', tagId),
    authorNotFound: authorId => ErrorFactory.notFound('内容作者', authorId),
  };

  /**
   * Template 模板相关异常
   */
  static template = {
    // 唯一性约束异常
    slugExists: value => ErrorFactory.uniqueConstraint('slug', value, '主题标识符已存在'),
    nameExists: value => ErrorFactory.uniqueConstraint('name', value, '主题名称已存在'),

    // 资源未找到异常
    notFound: id => ErrorFactory.notFound('模板主题', id),

    // 验证异常
    nameRequired: () => ErrorFactory.validation('主题名称不能为空'),
    slugRequired: () => ErrorFactory.validation('主题标识符不能为空'),
    slugInvalid: slug => ErrorFactory.validation(`主题标识符 "${slug}" 格式不正确，只能包含字母、数字、下划线和横线`),
    versionInvalid: version => ErrorFactory.validation(`版本号 "${version}" 格式不正确，应为 x.y.z 格式`),

    // 业务规则异常
    notInstalled: id => ErrorFactory.businessRule('TEMPLATE_NOT_INSTALLED', `主题 ${id} 未安装，无法激活`),
    alreadyActive: id => ErrorFactory.businessRule('TEMPLATE_ALREADY_ACTIVE', `主题 ${id} 已经是激活状态`),
    filesNotFound: (slug, files) =>
      ErrorFactory.businessRule('TEMPLATE_FILES_MISSING', `主题 "${slug}" 缺少必需文件: ${files.join(', ')}`),
    installFailed: (slug, reason) =>
      ErrorFactory.businessRule('TEMPLATE_INSTALL_FAILED', `主题 "${slug}" 安装失败: ${reason}`),
    cannotDeleteActive: slug =>
      ErrorFactory.businessRule('CANNOT_DELETE_ACTIVE_TEMPLATE', `无法删除激活中的主题 "${slug}"`),
    cannotDeleteDefault: slug =>
      ErrorFactory.businessRule('CANNOT_DELETE_DEFAULT_TEMPLATE', `无法删除系统默认主题 "${slug}"`),
    configInvalid: message => ErrorFactory.validation(`主题配置无效: ${message}`),
  };

  /**
   * Message 留言相关异常
   */
  static message = {
    // 资源未找到异常
    notFound: id => ErrorFactory.notFound('留言', id),
    contentNotFound: contentId => ErrorFactory.notFound('留言对应的内容', contentId),
    authorNotFound: authorId => ErrorFactory.notFound('留言作者', authorId),
    parentNotFound: parentId => ErrorFactory.notFound('父留言', parentId),

    // 验证异常
    contentRequired: () => ErrorFactory.validation('留言内容不能为空'),
    contentTooLong: maxLength => ErrorFactory.validation(`留言内容长度不能超过${maxLength}个字符`),
    contentTooShort: minLength => ErrorFactory.validation(`留言内容长度不能少于${minLength}个字符`),
    authorRequired: () => ErrorFactory.validation('必须指定留言作者（普通用户或管理员）'),
    invalidUserType: value => ErrorFactory.validation(`无效的用户类型: ${value}，只能是 0（普通用户）或 1（管理员）`),
    invalidState: value => ErrorFactory.validation(`无效的留言状态: ${value}，只能是 true（已举报）或 false（正常）`),

    // 业务规则异常
    alreadyPraised: (messageId, userId) =>
      ErrorFactory.businessRule('ALREADY_PRAISED', `用户 ${userId} 已经点赞过留言 ${messageId}`),
    notPraised: (messageId, userId) =>
      ErrorFactory.businessRule('NOT_PRAISED', `用户 ${userId} 尚未点赞留言 ${messageId}`),
    cannotReplyToSelf: () => ErrorFactory.businessRule('CANNOT_REPLY_TO_SELF', '不能回复自己的留言'),
    maxReplyDepthExceeded: maxDepth =>
      ErrorFactory.businessRule('MAX_REPLY_DEPTH_EXCEEDED', `回复层级不能超过${maxDepth}级`),
    reportedCannotReply: messageId =>
      ErrorFactory.businessRule('REPORTED_CANNOT_REPLY', `已举报的留言 ${messageId} 不能回复`),
    contentDisabledCannotComment: contentId =>
      ErrorFactory.businessRule('CONTENT_DISABLED_CANNOT_COMMENT', `内容 ${contentId} 已禁用评论`),
    tooManyMessages: (limit, timeWindow) =>
      ErrorFactory.businessRule('TOO_MANY_MESSAGES', `发布留言过于频繁，${timeWindow}分钟内最多发布${limit}条留言`),
    spamDetected: () => ErrorFactory.businessRule('SPAM_DETECTED', '检测到垃圾留言，请修改后重试'),
    messageReported: messageId => ErrorFactory.businessRule('MESSAGE_REPORTED', `留言 ${messageId} 已被举报，无法操作`),

    // 权限相关异常
    noCommentPermission: contentId => ErrorFactory.permission(`无权在内容 ${contentId} 下留言`),
    noEditPermission: messageId => ErrorFactory.permission(`无权编辑留言 ${messageId}`),
    noDeletePermission: messageId => ErrorFactory.permission(`无权删除留言 ${messageId}`),
    noReportPermission: () => ErrorFactory.permission('无权举报留言'),
    notOwner: (messageId, userId) =>
      ErrorFactory.businessRule('NOT_MESSAGE_OWNER', `用户 ${userId} 不是留言 ${messageId} 的作者`),

    // 审核相关异常
    alreadyReviewed: messageId => ErrorFactory.businessRule('ALREADY_REVIEWED', `留言 ${messageId} 已经审核过了`),
    reviewerRequired: () => ErrorFactory.validation('必须指定审核人'),
    dismissReasonRequired: () => ErrorFactory.validation('驳回留言时必须提供驳回原因'),

    // 批量操作异常
    batchSizeTooLarge: (size, maxSize) =>
      ErrorFactory.businessRule('BATCH_SIZE_TOO_LARGE', `批量操作数量 ${size} 超过限制 ${maxSize}`),
    emptyBatch: () => ErrorFactory.validation('批量操作不能为空'),
    partialBatchFailure: (total, success, failed) =>
      ErrorFactory.businessRule(
        'PARTIAL_BATCH_FAILURE',
        `批量操作部分失败：总数 ${total}，成功 ${success}，失败 ${failed}`
      ),
  };

  /**
   * SystemOptionLog相关异常
   */
  static systemOptionLog = {
    // 资源未找到异常
    notFound: id => ErrorFactory.notFound('系统操作日志', id),

    // 验证异常
    typeRequired: () => ErrorFactory.validation('日志类型不能为空'),
    typeInvalid: type => ErrorFactory.validation(`无效的日志类型: ${type}`),
    logsTooLong: maxLength => ErrorFactory.validation(`日志内容长度不能超过${maxLength}个字符`),

    // 业务规则异常
    cleanupFailed: reason => ErrorFactory.businessRule('LOG_CLEANUP_FAILED', `日志清理失败: ${reason}`),
    batchCreateFailed: reason => ErrorFactory.businessRule('BATCH_CREATE_FAILED', `批量创建日志失败: ${reason}`),
    dateRangeInvalid: () => ErrorFactory.validation('日期范围不正确，开始时间不能晚于结束时间'),
    retentionPolicyViolation: days =>
      ErrorFactory.businessRule('RETENTION_POLICY_VIOLATION', `违反日志保留策略，不能删除${days}天内的日志`),

    // 统计分析异常
    statsGenerationFailed: reason =>
      ErrorFactory.businessRule('STATS_GENERATION_FAILED', `统计数据生成失败: ${reason}`),
    unsupportedGroupBy: groupBy => ErrorFactory.validation(`不支持的分组字段: ${groupBy}`),

    // 日志清理异常
    cleanupInProgress: () => ErrorFactory.businessRule('CLEANUP_IN_PROGRESS', '日志清理操作正在进行中，请稍后再试'),
    insufficientPermission: () => ErrorFactory.permission('没有权限执行日志清理操作'),
  };

  /**
   * Plugin 插件相关异常
   */
  static plugin = {
    // 唯一性约束异常
    aliasExists: value => ErrorFactory.uniqueConstraint('alias', value, '插件别名已存在'),
    pkgNameExists: value => ErrorFactory.uniqueConstraint('pkgName', value, '包名已存在'),
    pluginIdExists: value => ErrorFactory.uniqueConstraint('pluginId', value, '插件ID已存在'),

    // 资源未找到异常
    notFound: id => ErrorFactory.notFound('插件', id),
    pluginNotFound: pluginId => ErrorFactory.notFound('插件（按插件ID）', pluginId),
    pkgNotFound: pkgName => ErrorFactory.notFound('插件包', pkgName),
    aliasNotFound: alias => ErrorFactory.notFound('插件（按别名）', alias),

    // 验证异常
    nameRequired: () => ErrorFactory.validation('插件名称不能为空'),
    aliasRequired: () => ErrorFactory.validation('插件别名不能为空'),
    pkgNameRequired: () => ErrorFactory.validation('包名不能为空'),
    pluginIdRequired: () => ErrorFactory.validation('插件源ID不能为空'),
    versionRequired: () => ErrorFactory.validation('插件版本不能为空'),
    nameTooLong: maxLength => ErrorFactory.validation(`插件名称长度不能超过${maxLength}个字符`),
    aliasTooLong: maxLength => ErrorFactory.validation(`插件别名长度不能超过${maxLength}个字符`),
    pkgNameTooLong: maxLength => ErrorFactory.validation(`包名长度不能超过${maxLength}个字符`),
    versionInvalid: version => ErrorFactory.validation(`版本号格式不正确: ${version}`),
    typeInvalid: type => ErrorFactory.validation(`插件类型无效: ${type}，只能是 1（内置）、2（扩展）或 3（第三方）`),
    amountInvalid: amount => ErrorFactory.validation(`价格必须是非负数: ${amount}`),
    configInvalid: field => ErrorFactory.validation(`${field}配置格式不正确，必须是有效的JSON格式`),

    // 业务规则异常
    alreadyInstalled: pluginId => ErrorFactory.businessRule('PLUGIN_ALREADY_INSTALLED', `插件 ${pluginId} 已经安装`),
    notInstalled: pluginId => ErrorFactory.businessRule('PLUGIN_NOT_INSTALLED', `插件 ${pluginId} 未安装`),
    alreadyEnabled: pluginId => ErrorFactory.businessRule('PLUGIN_ALREADY_ENABLED', `插件 ${pluginId} 已经启用`),
    alreadyDisabled: pluginId => ErrorFactory.businessRule('PLUGIN_ALREADY_DISABLED', `插件 ${pluginId} 已经禁用`),
    cannotUninstallBuiltin: pluginId =>
      ErrorFactory.businessRule('CANNOT_UNINSTALL_BUILTIN', `内置插件 ${pluginId} 不能卸载`),
    cannotDeleteSystemPlugin: pluginId =>
      ErrorFactory.businessRule('CANNOT_DELETE_SYSTEM_PLUGIN', `系统插件 ${pluginId} 不能删除`),

    // 安装/卸载异常
    installFailed: (pluginId, reason) =>
      ErrorFactory.businessRule('PLUGIN_INSTALL_FAILED', `插件 ${pluginId} 安装失败: ${reason}`),
    uninstallFailed: (pluginId, reason) =>
      ErrorFactory.businessRule('PLUGIN_UNINSTALL_FAILED', `插件 ${pluginId} 卸载失败: ${reason}`),
    updateFailed: (pluginId, reason) =>
      ErrorFactory.businessRule('PLUGIN_UPDATE_FAILED', `插件 ${pluginId} 更新失败: ${reason}`),
    downloadFailed: (pluginId, reason) =>
      ErrorFactory.businessRule('PLUGIN_DOWNLOAD_FAILED', `插件 ${pluginId} 下载失败: ${reason}`),

    // 依赖关系异常
    dependencyMissing: (pluginId, dependencies) =>
      ErrorFactory.businessRule('DEPENDENCY_MISSING', `插件 ${pluginId} 缺少依赖: ${dependencies.join(', ')}`),
    conflictExists: (pluginId, conflicts) =>
      ErrorFactory.businessRule('CONFLICT_EXISTS', `插件 ${pluginId} 与以下插件冲突: ${conflicts.join(', ')}`),
    circularDependency: plugins =>
      ErrorFactory.businessRule('CIRCULAR_DEPENDENCY', `检测到循环依赖: ${plugins.join(' -> ')}`),

    // 权限异常
    noInstallPermission: () => ErrorFactory.permission('没有插件安装权限'),
    noUninstallPermission: () => ErrorFactory.permission('没有插件卸载权限'),
    noManagePermission: () => ErrorFactory.permission('没有插件管理权限'),
    installorRequired: () => ErrorFactory.validation('必须指定插件安装者'),

    // 版本管理异常
    versionConflict: (pluginId, currentVersion, targetVersion) =>
      ErrorFactory.businessRule(
        'VERSION_CONFLICT',
        `插件 ${pluginId} 版本冲突：当前版本 ${currentVersion}，目标版本 ${targetVersion}`
      ),
    versionTooOld: (pluginId, minVersion) =>
      ErrorFactory.businessRule('VERSION_TOO_OLD', `插件 ${pluginId} 版本过低，最低要求版本 ${minVersion}`),
    noUpdateAvailable: pluginId => ErrorFactory.businessRule('NO_UPDATE_AVAILABLE', `插件 ${pluginId} 没有可用更新`),

    // 文件系统异常
    configFileError: (file, reason) =>
      ErrorFactory.businessRule('CONFIG_FILE_ERROR', `配置文件 ${file} 操作失败: ${reason}`),
    packageInstallError: (pkgName, reason) =>
      ErrorFactory.businessRule('PACKAGE_INSTALL_ERROR', `npm包 ${pkgName} 安装失败: ${reason}`),
    packageUninstallError: (pkgName, reason) =>
      ErrorFactory.businessRule('PACKAGE_UNINSTALL_ERROR', `npm包 ${pkgName} 卸载失败: ${reason}`),

    // 运行时异常
    initDataFailed: (pluginId, reason) =>
      ErrorFactory.businessRule('INIT_DATA_FAILED', `插件 ${pluginId} 初始化数据失败: ${reason}`),
    resourceInitFailed: (pluginId, reason) =>
      ErrorFactory.businessRule('RESOURCE_INIT_FAILED', `插件 ${pluginId} 资源初始化失败: ${reason}`),
    hookExecutionFailed: (pluginId, hook, reason) =>
      ErrorFactory.businessRule('HOOK_EXECUTION_FAILED', `插件 ${pluginId} 钩子 ${hook} 执行失败: ${reason}`),

    // 支付/授权异常
    paymentRequired: pluginId => ErrorFactory.businessRule('PAYMENT_REQUIRED', `插件 ${pluginId} 需要付费购买`),
    licenseExpired: pluginId => ErrorFactory.businessRule('LICENSE_EXPIRED', `插件 ${pluginId} 许可证已过期`),
    unauthorizedUsage: pluginId => ErrorFactory.businessRule('UNAUTHORIZED_USAGE', `插件 ${pluginId} 未经授权使用`),

    // 数据完整性异常
    dataCorrupted: pluginId => ErrorFactory.businessRule('DATA_CORRUPTED', `插件 ${pluginId} 数据已损坏`),
    configMissing: (pluginId, configType) =>
      ErrorFactory.businessRule('CONFIG_MISSING', `插件 ${pluginId} 缺少 ${configType} 配置`),
    invalidHookFormat: (pluginId, hook) => ErrorFactory.validation(`插件 ${pluginId} 钩子 ${hook} 格式不正确`),
  };

  /**
   * ApiKey 相关异常
   */
  static apiKey = {
    // 唯一性约束异常
    keyExists: value => ErrorFactory.uniqueConstraint('key', value, 'API Key已存在'),
    nameExists: value => ErrorFactory.uniqueConstraint('name', value, 'API Key名称已存在'),

    // 资源未找到异常
    notFound: id => ErrorFactory.notFound('API Key', id),
    keyNotFound: key => ErrorFactory.notFound('API Key（按Key）', key),

    // 验证异常
    nameRequired: () => ErrorFactory.validation('API Key名称不能为空'),
    nameTooLong: maxLength => ErrorFactory.validation(`API Key名称长度不能超过${maxLength}个字符`),
    keyRequired: () => ErrorFactory.validation('API Key不能为空'),
    secretRequired: () => ErrorFactory.validation('API Secret不能为空'),
    userIdRequired: () => ErrorFactory.validation('用户ID不能为空'),
    invalidStatus: value => ErrorFactory.validation(`无效的API Key状态: ${value}，只能是 active 或 disabled`),
    invalidPermissions: (message = '权限配置格式不正确，必须是数组') => ErrorFactory.validation(message),
    invalidIpWhitelist: (message = 'IP白名单格式不正确，必须是数组') => ErrorFactory.validation(message),
    invalidRateLimit: (message = '速率限制配置格式不正确') => ErrorFactory.validation(message),
    invalidExpiresAt: () => ErrorFactory.validation('过期时间格式不正确'),
    ipFormatInvalid: ip => ErrorFactory.validation(`IP地址格式不正确: ${ip}`),
    rateLimitInvalid: () => ErrorFactory.validation('速率限制必须是正整数'),

    // 业务规则异常
    expired: keyId => ErrorFactory.businessRule('API_KEY_EXPIRED', `API Key ${keyId} 已过期`),
    disabled: keyId => ErrorFactory.businessRule('API_KEY_DISABLED', `API Key ${keyId} 已被禁用`),
    rateLimitExceeded: (key, limit) =>
      ErrorFactory.businessRule('RATE_LIMIT_EXCEEDED', `API Key ${key} 超过速率限制: ${limit} 请求/小时`),
    ipNotWhitelisted: (key, ip) =>
      ErrorFactory.businessRule('IP_NOT_WHITELISTED', `API Key ${key} 的IP ${ip} 不在白名单中`),
    permissionDenied: (key, url, method) => ErrorFactory.permission(`API Key ${key} 无权访问 ${method} ${url}`),
    userNotFound: userId => ErrorFactory.notFound('API Key关联的用户', userId),
    cannotDeleteLastKey: userId =>
      ErrorFactory.businessRule('CANNOT_DELETE_LAST_KEY', `用户 ${userId} 不能删除最后一个API Key`),
    tooManyKeys: (userId, maxKeys) =>
      ErrorFactory.businessRule('TOO_MANY_KEYS', `用户 ${userId} 的API Key数量已达到上限: ${maxKeys}`),

    // 权限相关异常
    noCreatePermission: () => ErrorFactory.permission('没有创建API Key的权限'),
    noManagePermission: keyId => ErrorFactory.permission(`没有管理API Key ${keyId} 的权限`),
    notOwner: (keyId, userId) =>
      ErrorFactory.businessRule('NOT_API_KEY_OWNER', `用户 ${userId} 不是API Key ${keyId} 的所有者`),

    // 验证和认证异常
    invalidCredentials: () => ErrorFactory.authentication('API Key或Secret不正确'),
    keySecretMismatch: () => ErrorFactory.authentication('API Key和Secret不匹配'),
    authenticationFailed: () => ErrorFactory.authentication('API Key认证失败'),
  };

  /**
   * Webhook 相关异常
   */
  static webhook = {
    // 唯一性约束异常
    nameAlreadyExists: name => ErrorFactory.uniqueConstraint('name', name, 'Webhook名称已存在'),

    // 资源未找到异常
    notFound: id => ErrorFactory.notFound('Webhook', id),

    // 验证异常
    nameRequired: () => ErrorFactory.validation('Webhook名称不能为空'),
    nameTooLong: maxLength => ErrorFactory.validation(`Webhook名称长度不能超过${maxLength}个字符`),
    urlRequired: () => ErrorFactory.validation('Webhook URL不能为空'),
    invalidUrl: url => ErrorFactory.validation(`无效的URL格式: ${url}，必须以 http:// 或 https:// 开头`),
    userIdRequired: () => ErrorFactory.validation('用户ID不能为空'),
    eventsRequired: () => ErrorFactory.validation('至少需要订阅一个事件'),
    invalidEvent: event => ErrorFactory.validation(`无效的事件类型: ${event}`),
    descriptionTooLong: maxLength => ErrorFactory.validation(`Webhook描述长度不能超过${maxLength}个字符`),
    invalidRetryConfig: () => ErrorFactory.validation('重试配置格式不正确'),
    invalidMaxRetries: () => ErrorFactory.validation('最大重试次数必须在 0-10 之间'),
    invalidRetryDelay: () => ErrorFactory.validation('重试延迟必须在 100-60000 毫秒之间'),
    invalidTimeout: () => ErrorFactory.validation('超时时间必须在 1000-60000 毫秒之间'),

    // 业务规则异常
    disabled: id => ErrorFactory.businessRule('WEBHOOK_DISABLED', `Webhook ${id} 已被禁用`),
    deleted: id => ErrorFactory.businessRule('WEBHOOK_DELETED', `Webhook ${id} 已被删除`),
    notOwner: (webhookId, userId) =>
      ErrorFactory.businessRule('NOT_WEBHOOK_OWNER', `用户 ${userId} 不是 Webhook ${webhookId} 的所有者`),
    tooManyWebhooks: (userId, maxWebhooks) =>
      ErrorFactory.businessRule('TOO_MANY_WEBHOOKS', `用户 ${userId} 的Webhook数量已达到上限: ${maxWebhooks}`),

    // 权限相关异常
    noCreatePermission: () => ErrorFactory.permission('没有创建Webhook的权限'),
    noManagePermission: webhookId => ErrorFactory.permission(`没有管理Webhook ${webhookId} 的权限`),
  };

  /**
   * WebhookLog 相关异常
   */
  static webhookLog = {
    // 资源未找到异常
    notFound: id => ErrorFactory.notFound('Webhook日志', id),

    // 验证异常
    webhookIdRequired: () => ErrorFactory.validation('Webhook ID不能为空'),
    eventRequired: () => ErrorFactory.validation('事件类型不能为空'),
    payloadRequired: () => ErrorFactory.validation('事件负载不能为空'),

    // 业务规则异常
    maxRetriesExceeded: (logId, maxRetries) =>
      ErrorFactory.businessRule('MAX_RETRIES_EXCEEDED', `Webhook日志 ${logId} 已达到最大重试次数: ${maxRetries}`),
    alreadyCompleted: logId => ErrorFactory.businessRule('ALREADY_COMPLETED', `Webhook日志 ${logId} 已经完成`),
  };

  /**
   * Ads 相关异常
   */
  static ads = {
    // 唯一性约束异常
    nameExists: value => ErrorFactory.uniqueConstraint('name', value, '广告名称已存在'),

    // 资源未找到异常
    notFound: id => ErrorFactory.notFound('广告', id),

    // 验证异常
    nameRequired: () => ErrorFactory.validation('广告名称不能为空'),
    nameTooLong: maxLength => ErrorFactory.validation(`广告名称长度不能超过${maxLength}个字符`),
    invalidType: type =>
      ErrorFactory.validation(`无效的广告类型: ${type}，必须是 0（文字）、1（图片）或 2（友情链接）`),
    invalidHeight: height => ErrorFactory.validation(`无效的高度: ${height}，必须在 1-2000 之间`),

    // 业务规则异常
    hasItems: id => ErrorFactory.businessRule('ADS_HAS_ITEMS', `广告 ${id} 包含广告单元，无法删除`),
    disabled: id => ErrorFactory.businessRule('ADS_DISABLED', `广告 ${id} 已被禁用`),
  };

  /**
   * AdsItems 相关异常
   */
  static adsItems = {
    // 资源未找到异常
    notFound: id => ErrorFactory.notFound('广告单元', id),

    // 验证异常
    titleTooLong: maxLength => ErrorFactory.validation(`广告标题长度不能超过${maxLength}个字符`),
    invalidLink: link => ErrorFactory.validation(`无效的链接格式: ${link}，请以 http:// 或 https:// 开头`),
    invalidTarget: target =>
      ErrorFactory.validation(`无效的链接打开方式: ${target}，必须是 _blank、_self、_parent 或 _top`),
    invalidDimensions: message => ErrorFactory.validation(message),
    altTooLong: maxLength => ErrorFactory.validation(`广告alt标识长度不能超过${maxLength}个字符`),

    // 业务规则异常
    inUse: id => ErrorFactory.businessRule('ADS_ITEM_IN_USE', `广告单元 ${id} 正在被使用，无法删除`),
  };

  /**
   * 通用异常创建
   */
  static create = ErrorFactory;
}

module.exports = RepositoryExceptions;
