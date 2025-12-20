'use strict';

const registry = require('./registry');
const contentTags = require('./content');
const taxonomyTags = require('./taxonomy');
const utilityTags = require('./utility');
const filterTags = require('./filters');
const blockTags = require('./block');
const layoutTags = require('./layout');
const imageProcessTags = require('./imageprocess');

// Register all tags
registry.registerMultiple({
  // Content tags
  news: contentTags.News,
  recommend: contentTags.Recommend,
  hot: contentTags.Hot,
  random: contentTags.Random,
  nearpost: contentTags.NearPost,

  // Taxonomy tags
  tags: taxonomyTags.Tags,
  hottags: taxonomyTags.HotTags,
  navtree: taxonomyTags.NavTree,
  childnav: taxonomyTags.ChildNav,

  // Utility tags
  remote: utilityTags.Remote,
  ads: utilityTags.Ads,
  assets: utilityTags.Assets,
  head: utilityTags.Head,

  // Image processing tags
  imageprocess: imageProcessTags.ImageProcess,

  // Filter tags (注意：date, excerpt, imgurl, readingtime, encode 已在 template.js 中注册为 Nunjucks 过滤器)
  // 只保留需要复杂参数的 plural 作为自定义标签
  plural: filterTags.PluralFilter,

  // Block tags
  foreach: blockTags.ForeachTag,
  get: blockTags.GetTag,
  if: blockTags.IfTag,
  has: blockTags.HasTag,
  is: blockTags.IsTag,

  // Layout tags
  bodyclass: layoutTags.BodyClassTag,
  postclass: layoutTags.PostClassTag,
  navigation: layoutTags.NavigationTag,
  pagination: layoutTags.PaginationTag,
  search: layoutTags.SearchTag,
});

module.exports = registry;
