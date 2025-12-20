'use strict';

const BaseTag = require('./base');
const utils = require('./utils');

/**
 * Base taxonomy tag class with common functionality
 */
class TaxonomyTag extends BaseTag {
  constructor(ctx, actionType) {
    super(ctx);
    this.actionType = actionType || this.constructor.name.toLowerCase();
  }

  async _execute(context, args) {
    return utils.fetchContent(this.ctx, context, args, this.actionType);
  }
}

/**
 * Tags tag - Get content tags
 * Usage: {% tags key="contentTags" isPaging="0" %}
 */
class Tags extends TaxonomyTag {
  constructor(ctx) {
    super(ctx, 'tags');
  }
}

/**
 * HotTags tag - Get popular tags
 * Usage: {% hottags key="popularTags" %}
 */
class HotTags extends TaxonomyTag {
  constructor(ctx) {
    super(ctx, 'hottags');
  }
}

/**
 * NavTree tag - Get category tree
 * Usage: {% navtree key="categoryTree" %}
 */
class NavTree extends TaxonomyTag {
  constructor(ctx) {
    super(ctx, 'navtree');
  }
}

/**
 * ChildNav tag - Get child categories
 * Usage: {% childnav key="childCategories" %}
 */
class ChildNav extends TaxonomyTag {
  constructor(ctx) {
    super(ctx, 'childnav');
  }
}

module.exports = {
  Tags,
  HotTags,
  NavTree,
  ChildNav,
};
