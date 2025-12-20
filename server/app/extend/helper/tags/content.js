'use strict';

const BaseTag = require('./base');
const utils = require('./utils');

/**
 * Base content tag class with common functionality
 */
class ContentTag extends BaseTag {
  constructor(ctx, actionType) {
    super(ctx);
    this.actionType = actionType || this.constructor.name.toLowerCase();
  }

  async _execute(context, args) {
    return utils.fetchContent(this.ctx, context, args, this.actionType);
  }
}

/**
 * News tag - Get the latest content
 * Usage: {% news key="latestNews" typeId="xxx" pageSize="10" %}
 */
class News extends ContentTag {
  constructor(ctx) {
    super(ctx, 'news');
  }
}

/**
 * Recommend tag - Get recommended content
 * Usage: {% recommend key="featuredContent" typeId="xxx" pageSize="5" %}
 */
class Recommend extends ContentTag {
  constructor(ctx) {
    super(ctx, 'recommend');
  }
}

/**
 * Hot tag - Get popular content
 * Usage: {% hot key="popularContent" typeId="xxx" pageSize="10" %}
 */
class Hot extends ContentTag {
  constructor(ctx) {
    super(ctx, 'hot');
  }
}

/**
 * Random tag - Get random content
 * Usage: {% random key="randomContent" typeId="xxx" pageSize="5" %}
 */
class Random extends ContentTag {
  constructor(ctx) {
    super(ctx, 'random');
  }
}

/**
 * NearPost tag - Get content near the current post
 * Usage: {% nearpost key="relatedPosts" id="xxxxx" %}
 */
class NearPost extends ContentTag {
  constructor(ctx) {
    super(ctx, 'nearpost');
  }
}

module.exports = {
  News,
  Recommend,
  Hot,
  Random,
  NearPost,
};
