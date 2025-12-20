'use strict';

/**
 * Tag Registry for managing Nunjucks extensions
 */
class TagRegistry {
  constructor() {
    this.tags = new Map();
    this.initialized = false;
  }

  /**
   * Register a tag
   * @param {String} name - Name of the tag
   * @param {Class} TagClass - The tag class
   */
  register(name, TagClass) {
    if (this.tags.has(name)) {
      throw new Error(`Tag "${name}" is already registered`);
    }
    this.tags.set(name, TagClass);
  }

  /**
   * Register multiple tags
   * @param {Object} tagMap - Map of tag names to tag classes
   */
  registerMultiple(tagMap) {
    for (const [name, TagClass] of Object.entries(tagMap)) {
      this.register(name, TagClass);
    }
  }

  /**
   * Get a registered tag class
   * @param {String} name - Tag name
   * @return {Class} The tag class
   */
  get(name) {
    if (!this.tags.has(name)) {
      throw new Error(`Tag "${name}" is not registered`);
    }
    return this.tags.get(name);
  }

  /**
   * Check if a tag is registered
   * @param {String} name - Tag name
   * @return {Boolean} True if the tag is registered
   */
  has(name) {
    return this.tags.has(name);
  }

  /**
   * Get all registered tag names
   * @return {Array} Array of tag names
   */
  getTagNames() {
    return Array.from(this.tags.keys());
  }

  /**
   * Initialize all tags and register them with Nunjucks
   * @param {Object} app - The Egg.js app instance
   */
  initializeAll(app) {
    try {
      if (!app || !app.nunjucks) {
        console.error('Cannot initialize tags: app or app.nunjucks is not available');
        return;
      }

      const ctx = app.createAnonymousContext();

      for (const [name, TagClass] of this.tags.entries()) {
        try {
          // 简化：直接创建标签实例并注册
          const instance = new TagClass(ctx);

          // 确保实例有正确的标签名称
          if (!instance.tags || !Array.isArray(instance.tags)) {
            instance.tags = [name];
          }

          // 直接注册实例，Nunjucks会正确处理
          app.nunjucks.addExtension(name, instance);

          // app.logger.debug(`Tag ${name} registered successfully`);
        } catch (error) {
          app.logger.error(`Failed to register tag ${name}:`, error);
        }
      }

      this.initialized = true;
      app.logger.info(`Successfully registered ${this.tags.size} template tags`);
    } catch (error) {
      console.error('Error initializing tags:', error);
      if (app && app.logger) {
        app.logger.error('Error initializing tags:', error);
      }
    }
  }
}

// Create and export a singleton instance
const registry = new TagRegistry();
module.exports = registry;
