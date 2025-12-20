'use strict';

module.exports = {
  /**
   * validate data with rules
   *
   * @param  {Object} rules  - validate rule object, see [parameter](https://github.com/node-modules/parameter)
   * @param  {Object} [data] - validate target, default to `this.request.body`
   */
  validate(rules, data) {
    data = data || this.request.body;
    const errors = this.app.validator.validate(rules, data);
    if (errors) {
      let defaultNoticeStr = 'Validation Failed';
      if (errors.length > 0) {
        const firstErr = errors[0];
        const errorMessage = this.getValidationMessage(rules, firstErr);

        if (errorMessage) {
          defaultNoticeStr = firstErr.message = errorMessage;
        } else if (rules[firstErr.field] && rules[firstErr.field].message) {
          defaultNoticeStr = firstErr.message = rules[firstErr.field].message;
        }
      }

      this.throw(422, defaultNoticeStr, {
        code: 'invalid_param',
        errors,
      });
    }
  },

  /**
   * Get validation error message with i18n support
   * @param {Object} rules - validation rules
   * @param {Object} error - validation error
   * @return {string} error message
   */
  getValidationMessage(rules, error) {
    const { field, code } = error;
    const rule = rules[field];

    if (!rule) return null;

    // Get field display name for placeholder replacement
    const fieldDisplayName = '';
    // const fieldDisplayName = this.getFieldDisplayName(field);

    // Try to get i18n message first
    const i18nKey = this.getValidationI18nKey(field, code);
    if (i18nKey && this.__ && typeof this.__ === 'function') {
      try {
        // Pass field display name as parameter for {0} placeholder replacement
        const i18nMessage = this.__(i18nKey, fieldDisplayName);
        if (i18nMessage && i18nMessage !== i18nKey) {
          return i18nMessage;
        }
      } catch (e) {
        // Fallback to default message if i18n fails
      }
    }

    // Fallback to rule message or generate default message
    if (rule.message) {
      return rule.message;
    }

    return this.getDefaultValidationMessage(field, code, rule);
  },

  /**
   * Get i18n key for validation error
   * @param {string} field - field name
   * @param {string} code - error code
   * @return {string} i18n key
   */
  getValidationI18nKey(field, code) {
    // Determine module from current route or context
    const module = this.getValidationModule();

    // Try module-specific field message first: validation.admin.userPhone.format
    if (module && code === 'invalid') {
      const moduleKey = `validation.${module}.${field}.format`;
      if (this.hasI18nKey(moduleKey)) {
        return moduleKey;
      }
    }
    if (module && code === 'missing_field') {
      const moduleKey = `validation.${module}.${field}.required`;
      if (this.hasI18nKey(moduleKey)) {
        return moduleKey;
      }
    }
    if (module && code === 'invalid_param') {
      const moduleKey = `validation.${module}.${field}.enum`;
      if (this.hasI18nKey(moduleKey)) {
        return moduleKey;
      }
    }

    // Fallback to generic field message: validation.field.required
    if (code === 'missing_field') {
      return 'validation.field.required';
    }
    if (code === 'invalid') {
      return 'validation.field.format';
    }
    if (code === 'invalid_param') {
      return 'validation.field.enum';
    }

    return null;
  },

  /**
   * Get validation module from current context
   * @return {string|null} module name
   */
  getValidationModule() {
    // Try to determine module from route path
    const url = this.request.url || '';

    // Match common patterns
    if (url.includes('/manage/ai') || url.includes('/ai')) {
      return 'ai';
    }
    if (url.includes('/manage/admin') || url.includes('/admin')) {
      return 'admin';
    }
    if (url.includes('/manage/role') || url.includes('/role')) {
      return 'role';
    }
    if (url.includes('/manage/menu') || url.includes('/menu')) {
      return 'menu';
    }
    if (url.includes('/content')) {
      return 'content';
    }
    if (url.includes('/system')) {
      return 'system';
    }

    // Try to get from controller name
    const controllerName = this.request.controller;
    if (controllerName) {
      return controllerName.toLowerCase();
    }

    return null;
  },

  /**
   * Check if i18n key exists
   * @param {string} key - i18n key
   * @return {boolean} whether key exists
   */
  hasI18nKey(key) {
    if (!this.__ || typeof this.__ !== 'function') {
      return false;
    }

    try {
      const message = this.__(key);
      return message && message !== key;
    } catch (e) {
      return false;
    }
  },

  /**
   * Generate default validation message
   * @param {string} field - field name
   * @param {string} code - error code
   * @param {Object} rule - validation rule
   * @return {string} default message
   */
  getDefaultValidationMessage(field, code, rule) {
    const fieldName = this.getFieldDisplayName(field);

    switch (code) {
      case 'missing_field':
        return `${fieldName} is required`;
      case 'invalid':
        if (rule.format) {
          return `${fieldName} format is invalid`;
        }
        return `${fieldName} is invalid`;
      case 'invalid_param':
        if (rule.enum) {
          return `${fieldName} must be one of: ${rule.enum.join(', ')}`;
        }
        return `${fieldName} is invalid`;
      default:
        return `${fieldName} validation failed`;
    }
  },

  /**
   * Get display name for field
   * @param {string} field - field name
   * @return {string} display name
   */
  getFieldDisplayName(field) {
    // Common field mappings across all modules
    const commonFieldMap = {
      // User related
      userName: 'Username',
      userPhone: 'Phone number',
      userEmail: 'Email address',
      userGender: 'Gender',
      nickName: 'Nickname',
      password: 'Password',

      // Common fields
      name: 'Name',
      title: 'Title',
      description: 'Description',
      status: 'Status',
      type: 'Type',
      sort: 'Sort order',

      // Role related
      roleName: 'Role name',
      roleDescription: 'Role description',

      // Menu related
      menuName: 'Menu name',
      menuPath: 'Menu path',
      menuIcon: 'Menu icon',

      // Content related
      contentTitle: 'Content title',
      contentDescription: 'Content description',
      categoryName: 'Category name',

      // System related
      configKey: 'Config key',
      configValue: 'Config value',

      // AI related
      apiKey: 'API Key',
      provider: 'Provider',
      modelName: 'Model name',
      displayName: 'Display name',
      apiEndpoint: 'API endpoint',

      // Common IDs
      id: 'ID',
      parentId: 'Parent ID',
      userId: 'User ID',
      roleId: 'Role ID',
      menuId: 'Menu ID',
      categoryId: 'Category ID',
    };

    return commonFieldMap[field] || this.formatFieldName(field);
  },

  /**
   * Format field name to display name
   * @param {string} field - field name
   * @return {string} formatted display name
   */
  formatFieldName(field) {
    // Convert camelCase to readable format
    return field
      .replace(/([A-Z])/g, ' $1') // Insert space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  },
};
