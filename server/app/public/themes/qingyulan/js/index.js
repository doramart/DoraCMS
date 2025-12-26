tailwind.config = {
  theme: {
    extend: {
      colors: { primary: '#1e88e5', secondary: '#64b5f6' },
      borderRadius: {
        none: '0px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        full: '9999px',
        button: '8px',
      },
    },
  },
};

/**
 * 文章管理器 - 兼容性版本 (支持 IE9+)
 * 使用传统构造函数模式替代 ES6 class
 */
function ArticleManager() {
  // 私有属性
  this.isLoading = false;
  this.scrollTimeout = null;
  this.pages = {
    recommend: { current: 1, hasMore: true },
    latest: { current: 1, hasMore: true }
  };
  
  // 初始化
  this.init();
}

/**
 * 初始化方法
 */
ArticleManager.prototype.init = function() {
  this.bindEvents();
  this.initScrollListener();
};

/**
 * 绑定所有事件
 */
ArticleManager.prototype.bindEvents = function() {
  this.bindTabEvents();
  this.bindCardHoverEvents();
  this.bindMenuEvents();
  this.bindButtonEvents();
  this.bindScrollEvents();
  this.bindCommentEvents();
  this.bindSearchEvents();
};

/**
 * 标签切换事件
 */
ArticleManager.prototype.bindTabEvents = function() {
  var self = this;
  $('.custom-tab').on('click', function(e) {
    e.preventDefault();
    var $tab = $(this);
    var targetTab = $tab.data('tab');
    
    $('.custom-tab').removeClass('active');
    $tab.addClass('active');
    
    $('.tab-content').addClass('hidden');
    $('#' + targetTab + '-content').removeClass('hidden');
    
    $(document).trigger('tabChanged', { activeTab: targetTab });
  });
};

/**
 * 文章卡片悬停效果
 */
ArticleManager.prototype.bindCardHoverEvents = function() {
  $(document).on('mouseenter', '.article-card', function() {
    $(this).addClass('shadow-md');
  }).on('mouseleave', '.article-card', function() {
    $(this).removeClass('shadow-md');
  });
};

/**
 * 响应式菜单事件
 */
ArticleManager.prototype.bindMenuEvents = function() {
  $('.menu-toggle').on('click', function() {
    $('.mobile-menu').toggleClass('hidden');
  });
};

/**
 * 按钮事件
 */
ArticleManager.prototype.bindButtonEvents = function() {
  var self = this;
  
  // 创作中心按钮
  $('#create-center-btn').on('click', function() {
    window.location.href = '/user-center/my-articles';
  });

  // 退出登录按钮
  $('#logout-btn').on('click', function(e) {
    e.preventDefault();
    self.handleLogout();
  });

  // 登录按钮
  $('#login-btn').on('click', function(e) {
    e.preventDefault();
    window.location.href = '/user-center/login';
  });

  // 写文章按钮
  $('#write-article-btn').on('click', function(e) {
    e.preventDefault();
    window.location.href = '/user-center/my-articles/create';
  });

  // 草稿箱按钮
  $('#drafts-btn').on('click', function(e) {
    e.preventDefault();
    window.location.href = '/user-center/my-articles';
  });

  // 文章点赞按钮
  $('#like-post-btn').on('click', function(e) {
    e.preventDefault();
    var $btn = $(this);
    var postId = $btn.data('post-id') || $('#post_id').val();
    
    if (postId) {
      self.handlePostLike(postId, $btn);
    } else {
      self.showMessage('获取文章ID失败', 'error');
    }
  });

  // 文章收藏按钮
  $('#favorite-post-btn').on('click', function(e) {
    e.preventDefault();
    var $btn = $(this);
    var postId = $btn.data('post-id') || $('#post_id').val();
    
    if (postId) {
      self.handlePostFavorite(postId, $btn);
    } else {
      self.showMessage('获取文章ID失败', 'error');
    }
  });

  // 加载更多按钮
  $('#load-more-btn').on('click', function() {
    var $btn = $(this);
    var currentTab = self.getCurrentTab();
    
    // console.log('加载更多内容，当前tab:', currentTab);
    
    self.toggleLoadingState($btn, true);
    
    setTimeout(function() {
      self.toggleLoadingState($btn, false);
    }, 1000);
  });
};

/**
 * 滚动相关事件
 */
ArticleManager.prototype.bindScrollEvents = function() {
  var $backToTop = $('#backToTop');
  
  $(window).on('scroll', function() {
    var shouldShow = $(window).scrollTop() > 300;
    $backToTop.toggleClass('opacity-100', shouldShow)
             .toggleClass('opacity-0', !shouldShow);
  });

  $backToTop.on('click', function() {
    $('html, body').animate({ scrollTop: 0 }, 'smooth');
  });
};

/**
 * 评论回复事件
 */
ArticleManager.prototype.bindCommentEvents = function() {
  $('[class*="ri-reply-line"]').closest('button').on('click', function() {
    $('.comment-input').focus().attr('placeholder', '回复评论...');
  });
};

/**
 * 搜索事件
 */
ArticleManager.prototype.bindSearchEvents = function() {
  var self = this;
  
  // 监听搜索表单提交事件
  $('#searchForm').on('submit', function(e) {
    e.preventDefault();
    self.handleSearch();
  });
  
  // 监听搜索输入框回车键事件
  $('#searchInput').on('keypress', function(e) {
    if (e.which === 13) { // Enter键
      e.preventDefault();
      self.handleSearch();
    }
  });
  
  // 监听搜索按钮点击事件
  $('#searchButton').on('click', function(e) {
    e.preventDefault();
    self.handleSearch();
  });
};

/**
 * 处理搜索操作
 */
ArticleManager.prototype.handleSearch = function() {
  var keywords = $('#searchInput').val().trim();
  
  if (keywords) {
    // 跳转到搜索结果页面
    window.location.href = '/search/' + encodeURIComponent(keywords);
  } else {
    // 如果搜索关键字为空，可以给出提示或者聚焦到输入框
    $('#searchInput').focus();
  }
};

/**
 * 处理退出登录
 */
ArticleManager.prototype.handleLogout = function() {
  var self = this;
  
  // 显示确认对话框
  this.showConfirmDialog(
    '确认退出登录',
    '您确定要退出登录吗？退出后需要重新登录才能使用完整功能。',
    function() {
      // 用户确认退出，调用退出登录API
      self.performLogout();
    }
  );
};

/**
 * 执行退出登录操作
 */
ArticleManager.prototype.performLogout = function() {
  // console.log('performLogout方法被调用'); // 调试日志
  var self = this;
  
  // 显示退出中状态
  // console.log('显示退出中状态...'); // 调试日志
  
  try {
    this.showMessage('正在退出登录...', 'info');
  } catch (error) {
    // console.error('showMessage失败，使用简单消息:', error);
    this.showSimpleMessage('正在退出登录...', 'info');
  }
  
  // console.log('开始调用退出登录API...'); // 调试日志
  this.apiRequest('/api/v1/auth/logout', {
    method: 'POST'
  }).then(function(result) {
    // console.log('API调用成功，返回结果:', result); // 调试日志
    if (result && result.status === 200) {
      try {
        localStorage.removeItem('doracms_user_token');
        self.showMessage('退出登录成功！', 'success');
      } catch (error) {
        // console.error('showMessage失败，使用简单消息:', error);
        self.showSimpleMessage('退出登录成功！', 'success');
      }
      
      // 延迟一下然后刷新页面
      setTimeout(function() {
        // console.log('准备刷新页面...'); // 调试日志
        window.location.reload();
      }, 1000);
    } else {
      // console.log('退出登录失败:', result); // 调试日志
      try {
        self.showMessage(result.message || '退出登录失败，请重试', 'error');
      } catch (error) {
        // console.error('showMessage失败，使用简单消息:', error);
        self.showSimpleMessage(result.message || '退出登录失败，请重试', 'error');
      }
    }
  }).catch(function(error) {
    // console.error('退出登录失败:', error);
    try {
      self.showMessage('退出登录失败，请检查网络连接', 'error');
    } catch (error) {
      // console.error('showMessage失败，使用简单消息:', error);
      self.showSimpleMessage('退出登录失败，请检查网络连接', 'error');
    }
  });
};

/**
 * 显示确认对话框
 */
ArticleManager.prototype.showConfirmDialog = function(title, message, onConfirm, onCancel) {
  var self = this;
  
  // 创建遮罩层
  var $overlay = $('<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"></div>');
  
  // 创建对话框
  var $dialog = $(
    '<div class="bg-white rounded-lg shadow-xl max-w-md mx-4 w-full">' +
      '<div class="p-6">' +
        '<div class="flex items-center mb-4">' +
          '<div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">' +
            '<i class="ri-question-line text-yellow-600"></i>' +
          '</div>' +
          '<h3 class="text-lg font-semibold text-gray-900">' + title + '</h3>' +
        '</div>' +
        '<p class="text-sm text-gray-600 mb-6">' + message + '</p>' +
        '<div class="flex justify-end space-x-3">' +
          '<button class="cancel-btn px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">' +
            '取消' +
          '</button>' +
          '<button class="confirm-btn px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">' +
            '确认退出' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
  
  $overlay.append($dialog);
  $('body').append($overlay);
  
  // 绑定按钮事件
  $dialog.find('.cancel-btn').on('click', function() {
    self.hideConfirmDialog($overlay);
    if (onCancel && typeof onCancel === 'function') {
      onCancel();
    }
  });
  
  $dialog.find('.confirm-btn').on('click', function() {
    self.hideConfirmDialog($overlay);
    if (onConfirm && typeof onConfirm === 'function') {
      onConfirm();
    }
  });
  
  // 点击遮罩层关闭
  $overlay.on('click', function(e) {
    if (e.target === $overlay[0]) {
      self.hideConfirmDialog($overlay);
      if (onCancel && typeof onCancel === 'function') {
        onCancel();
      }
    }
  });
  
  // ESC键关闭
  $(document).on('keydown.confirmDialog', function(e) {
    if (e.keyCode === 27) { // ESC键
      self.hideConfirmDialog($overlay);
      if (onCancel && typeof onCancel === 'function') {
        onCancel();
      }
    }
  });
  
  // 显示动画
  $overlay.css('opacity', '0').animate({ opacity: 1 }, 200);
  $dialog.css('transform', 'scale(0.9)').animate({
    transform: 'scale(1)'
  }, 200);
};

/**
 * 隐藏确认对话框
 */
ArticleManager.prototype.hideConfirmDialog = function($overlay) {
  // 移除ESC键监听
  $(document).off('keydown.confirmDialog');
  
  // 隐藏动画
  $overlay.animate({ opacity: 0 }, 200, function() {
    $overlay.remove();
  });
};

/**
 * 显示消息提示
 */
ArticleManager.prototype.showMessage = function(message, type) {
  // console.log('showMessage调用:', message, type); // 调试日志
  
  // 简单的后备方案 - 如果复杂的实现失败，使用alert
  try {
    type = type || 'info';
    
    var iconClass = {
      'success': 'text-green-500',
      'error': 'text-red-500', 
      'warning': 'text-yellow-500',
      'info': 'text-blue-500'
    }[type] || 'text-blue-500';
    
    var iconName = {
      'success': 'ri-check-line',
      'error': 'ri-error-warning-line',
      'warning': 'ri-error-warning-line',
      'info': 'ri-information-line'
    }[type] || 'ri-information-line';
    
    // 检查jQuery是否可用
    if (typeof $ === 'undefined') {
      // console.error('jQuery不可用，使用alert作为后备方案');
      alert(message);
      return;
    }
    
    // 创建提示元素
    var $toast = $(
      '<div class="message-toast fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 max-w-sm" style="transform: translateX(100%); transition: all 0.3s ease;">' +
        '<div class="flex items-center">' +
          '<div class="w-4 h-6 mr-2 ' + iconClass + '">' +
            '<i class="' + iconName + '"></i>' +
          '</div>' +
          '<span class="text-sm text-gray-800">' + message + '</span>' +
        '</div>' +
      '</div>'
    );
    
    $('body').append($toast);
    
    // console.log('Toast元素已添加到页面，元素数量:', $('.message-toast').length); // 调试日志
    
    // 显示动画 - 使用setTimeout确保DOM更新后再应用样式
    setTimeout(function() {
      $toast.css('transform', 'translateX(0)');
    }, 10);
    
    // 3秒后自动消失
    setTimeout(function() {
      $toast.css({
        'transform': 'translateX(100%)',
        'opacity': '0'
      });
      
      // 动画完成后移除元素
      setTimeout(function() {
        $toast.remove();
      }, 300);
    }, 3000);
    
  } catch (error) {
    // console.error('showMessage出错，使用alert作为后备方案:', error);
    alert(message);
  }
};

/**
 * 简单的消息显示方法（后备方案）
 */
ArticleManager.prototype.showSimpleMessage = function(message, type) {
  // 最简单的实现
  var prefix = '';
  switch(type) {
    case 'success': prefix = '✅ '; break;
    case 'error': prefix = '❌ '; break;
    case 'warning': prefix = '⚠️ '; break;
    default: prefix = 'ℹ️ '; break;
  }
  alert(prefix + message);
};

/**
 * 测试showMessage方法 - 可以在浏览器控制台调用
 */
ArticleManager.prototype.testShowMessage = function() {
  // console.log('测试showMessage方法...');
  this.showMessage('这是一个测试消息', 'info');
  
  setTimeout(() => {
    this.showMessage('测试成功消息', 'success');
  }, 1000);
  
  setTimeout(() => {
    this.showMessage('测试错误消息', 'error');
  }, 2000);
  
  setTimeout(() => {
    this.showMessage('测试警告消息', 'warning');
  }, 3000);
};

/**
 * 初始化滚动监听
 */
ArticleManager.prototype.initScrollListener = function() {
  var self = this;
  
  $(window).on('scroll', function() {
    if (self.scrollTimeout) {
      clearTimeout(self.scrollTimeout);
    }
    
    self.scrollTimeout = setTimeout(function() {
      self.checkScrollPosition();
    }, 100);
  });
};

/**
 * 检查滚动位置并加载更多
 */
ArticleManager.prototype.checkScrollPosition = function() {
  var scrollTop = $(window).scrollTop();
  var windowHeight = $(window).height();
  var documentHeight = $(document).height();
  
  if (scrollTop + windowHeight >= documentHeight - 100) {
    var currentTab = this.getCurrentTab();
    var pageInfo = this.pages[currentTab];
    
    if (!this.isLoading && pageInfo.hasMore) {
      this.loadMoreArticles(currentTab);
    }
  }
};

/**
 * 获取当前激活的标签
 */
ArticleManager.prototype.getCurrentTab = function() {
  return $('.custom-tab.active').data('tab') || 'recommend';
};

/**
 * 切换按钮加载状态
 */
ArticleManager.prototype.toggleLoadingState = function($btn, isLoading) {
  if (isLoading) {
    $btn.data('original-text', $btn.html())
        .html('<span>加载中...</span>')
        .prop('disabled', true);
  } else {
    $btn.html($btn.data('original-text'))
        .prop('disabled', false);
  }
};

/**
 * 加载更多文章
 */
ArticleManager.prototype.loadMoreArticles = function(tabType) {
  var self = this;
  
  if (this.isLoading || !this.pages[tabType].hasMore) return;

  // console.log('开始加载第 ' + (this.pages[tabType].current + 1) + ' 页' + 
              // (tabType === 'recommend' ? '推荐' : '最新') + '文章');
  
  this.isLoading = true;
  this.pages[tabType].current++;
  
  this.showLoadingIndicator(tabType);
  
  var params = {
    isPaging: '1',
    pageSize: '20',
    current: this.pages[tabType].current
  };
  
  if (tabType === 'recommend') {
    params.model = '1';
  }
  
  this.apiRequest('/api/v1/content', {
    method: 'GET',
    data: params
  }).then(function(result) {
    if (result && result.status === 200 && result.data && result.data.docs && result.data.docs.length > 0) {
      self.renderArticleCards(result.data.docs, tabType);
      
      if (self.pages[tabType].current >= (result.data.pageInfo && result.data.pageInfo.totalPage)) {
        self.pages[tabType].hasMore = false;
        self.showArticleMessage(tabType, '没有更多文章了', 'no-more', 3000);
      }
    } else {
      self.pages[tabType].hasMore = false;
      self.showArticleMessage(tabType, '没有更多文章了', 'no-more', 3000);
    }
  }).catch(function(error) {
    // console.error('加载' + (tabType === 'recommend' ? '推荐' : '最新') + '文章失败:', error);
    self.pages[tabType].current--;
    self.showArticleMessage(tabType, '加载失败，请稍后重试', 'error', 3000);
  }).always(function() {
    self.isLoading = false;
    self.hideLoadingIndicator(tabType);
  });
};

/**
 * 使用 jQuery 的 AJAX 请求方法
 */
ArticleManager.prototype.apiRequest = function(url, options) {
  options = options || {};
  var method = options.method || 'GET';
  var data = options.data || {};
  var headers = options.headers || {};
  
  var ajaxOptions = {
    url: url,
    method: method,
    headers: $.extend({
      'Content-Type': 'application/json'
    }, headers)
  };

  if (method.toUpperCase() === 'GET') {
    ajaxOptions.data = data;
  } else {
    ajaxOptions.data = JSON.stringify(data);
  }

  return $.ajax(ajaxOptions).fail(function(error) {
    // console.error('API请求失败:', error);
    throw error;
  });
};

/**
 * 渲染文章卡片
 */
ArticleManager.prototype.renderArticleCards = function(articles, tabType) {
  var $container = $('#' + tabType + '-content');
  var self = this;
  
  $.each(articles, function(index, item) {
    var $card = self.createArticleCard(item);
    $container.append($card);
  });
};

/**
 * 创建文章卡片
 */
ArticleManager.prototype.createArticleCard = function(item) {
  var formattedDate = new Date(item.createdAt).toISOString().split('T')[0];
  var description = item.discription ? 
    (item.discription.length > 150 ? item.discription.substring(0, 150) + '...' : item.discription) : '';
  
  var tagsHtml = '';
  if (item.tags && item.tags.length > 0) {
    tagsHtml = $.map(item.tags, function(tag) {
      return '<a href="#" class="px-2 py-0.5 bg-blue-50 text-primary rounded-full hover:bg-blue-100 transition-colors">' + tag.name + '</a>';
    }).join('');
  }
  
  var cardHtml = [
    '<div class="article-card bg-white rounded-sm shadow-sm p-4 transition-all duration-200 mb-4">',
      '<div class="flex justify-between">',
        '<div class="flex-1 pr-4">',
          '<h3 class="text-base font-bold mb-2">',
            '<a href="/details/' + item._id + '" data-readdy="true" class="hover:text-primary transition-colors">',
              item.title,
            '</a>',
          '</h3>',
          '<p class="text-xs text-gray-600 mb-3">' + description + '</p>',
          '<div class="flex items-center justify-between text-xs text-gray-500">',
            '<div class="flex items-center space-x-3">',
              '<span>' + formattedDate + '</span>',
              '<div class="flex items-center space-x-1">',
                '<div class="w-3 h-3 flex items-center justify-center">',
                  '<i class="ri-eye-line"></i>',
                '</div>',
                '<span>' + (item.clickNum || 0) + '</span>',
              '</div>',
              '<div class="flex items-center space-x-1">',
                '<div class="w-3 h-3 flex items-center justify-center">',
                  '<i class="ri-thumb-up-line"></i>',
                '</div>',
                '<span>' + (item.likeNum || 0) + '</span>',
              '</div>',
            '</div>',
            '<div class="flex items-center space-x-2">',
              tagsHtml,
            '</div>',
          '</div>',
        '</div>',
        '<div class="w-32 h-20 bg-gray-100 rounded-sm overflow-hidden">',
          '<img src="' + (item.sImg || '') + '" alt="' + item.title + '" class="w-full h-full object-cover object-top" />',
        '</div>',
      '</div>',
    '</div>'
  ].join('');
  
  return $(cardHtml);
};

/**
 * 显示/隐藏加载指示器
 */
ArticleManager.prototype.showLoadingIndicator = function(tabType) {
  var $container = $('#' + tabType + '-content');
  var indicatorId = 'loading-indicator-' + tabType;
  
  if (!$('#' + indicatorId).length) {
    var indicatorHtml = [
      '<div id="' + indicatorId + '" class="text-center py-4">',
        '<div class="flex items-center justify-center space-x-2">',
          '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>',
          '<span class="text-sm text-gray-500">加载中...</span>',
        '</div>',
      '</div>'
    ].join('');
    
    $container.append($(indicatorHtml));
  }
};

ArticleManager.prototype.hideLoadingIndicator = function(tabType) {
  $('#loading-indicator-' + tabType).remove();
};

/**
 * 显示文章列表消息
 */
ArticleManager.prototype.showArticleMessage = function(tabType, message, type, autoRemove) {
  var $container = $('#' + tabType + '-content');
  var messageId = type + '-message-' + tabType;
  
  if (!$('#' + messageId).length) {
    var colorClass = type === 'error' ? 'text-red-500' : 'text-gray-500';
    var messageHtml = [
      '<div id="' + messageId + '" class="text-center py-4 text-sm ' + colorClass + '">',
        message,
      '</div>'
    ].join('');
    
    var $message = $(messageHtml);
    $container.append($message);
    
    if (autoRemove && autoRemove > 0) {
      setTimeout(function() {
        $message.remove();
      }, autoRemove);
    }
  }
};

/**
 * 处理文章点赞
 */
ArticleManager.prototype.handlePostLike = function(postId, $btn) {
  var self = this;
  
  // 防止重复点击
  if ($btn.hasClass('liked') || $btn.prop('disabled')) {
    return;
  }
  
  // 检查登录状态
  var loginedFlag = $('#logined').val();
  if (loginedFlag !== 'true') {
    this.showMessage('请先登录后再点赞', 'warning');
    setTimeout(function() {
      window.location.href = '/user-center/login';
    }, 1500);
    return;
  }
  
  // 禁用按钮防止重复提交
  $btn.prop('disabled', true);
  var $icon = $btn.find('i');
  var $count = $('#like-count');
  var originalIcon = $icon.attr('class');
  
  // 显示加载状态
  $icon.attr('class', 'ri-loader-2-line animate-spin');
  
  // 调用点赞API (RESTful: POST /api/v1/content/:id/like)
  this.apiRequest('/api/v1/content/' + postId + '/like', {
    method: 'POST'
  }).then(function(data) {
    if (data.status == 200) {
      // 更新点赞状态和数量
      $btn.addClass('liked');
      $btn.removeClass('bg-primary hover:bg-opacity-90').addClass('bg-green-500 hover:bg-green-600');
      
      var currentCount = Number($count.text()) || 0;
      var newCount = currentCount + 1;
      $count.text(newCount);
      
      // 更新图标为已点赞状态
      $icon.attr('class', 'ri-thumb-up-fill');
      
      self.showMessage(data.message || '点赞成功！', 'success');
    } else {
      // 恢复原状
      $icon.attr('class', originalIcon);
      self.showMessage(data.message || '点赞失败，请重试', 'error');
    }
  }).catch(function(error) {
    // console.error('点赞失败:', error);
    $icon.attr('class', originalIcon);
    self.showMessage('点赞失败，请检查网络连接', 'error');
  }).always(function() {
    // 恢复按钮状态
    $btn.prop('disabled', false);
    if (!$btn.hasClass('liked')) {
      $icon.attr('class', originalIcon);
    }
  });
};

/**
 * 处理文章收藏
 */
ArticleManager.prototype.handlePostFavorite = function(postId, $btn) {
  var self = this;
  
  // 防止重复点击
  if ($btn.hasClass('favorited') || $btn.prop('disabled')) {
    return;
  }
  
  // 检查登录状态
  var loginedFlag = $('#logined').val();
  if (loginedFlag !== 'true') {
    this.showMessage('请先登录后再收藏', 'warning');
    setTimeout(function() {
      window.location.href = '/user-center/login';
    }, 1500);
    return;
  }
  
  // 禁用按钮防止重复提交
  $btn.prop('disabled', true);
  var $icon = $btn.find('i');
  var $count = $('#favorite-count');
  var originalIcon = $icon.attr('class');
  
  // 显示加载状态
  $icon.attr('class', 'ri-loader-2-line animate-spin');
  
  // 调用收藏API (RESTful: POST /api/v1/content/:id/favorite)
  this.apiRequest('/api/v1/content/' + postId + '/favorite', {
    method: 'POST'
  }).then(function(data) {
    if (data.status == 200) {
      // 更新收藏状态和数量
      $btn.addClass('favorited');
      $btn.removeClass('border-gray-300 text-gray-700 hover:bg-gray-50')
          .addClass('border-yellow-500 text-yellow-600 bg-yellow-50 hover:bg-yellow-100');
      
      var currentCount = Number($count.text()) || 0;
      var newCount = currentCount + 1;
      $count.text(newCount);
      
      // 更新图标为已收藏状态
      $icon.attr('class', 'ri-star-fill');
      
      self.showMessage(data.message || '收藏成功！', 'success');
    } else {
      // 恢复原状
      $icon.attr('class', originalIcon);
      self.showMessage(data.message || '收藏失败，请重试', 'error');
    }
  }).catch(function(error) {
    // console.error('收藏失败:', error);
    $icon.attr('class', originalIcon);
    self.showMessage('收藏失败，请检查网络连接', 'error');
  }).always(function() {
    // 恢复按钮状态
    $btn.prop('disabled', false);
    if (!$btn.hasClass('favorited')) {
      $icon.attr('class', originalIcon);
    }
  });
};

// 全局变量声明
var articleManager;
var messageBoardManager;

// 页面准备就绪后初始化所有管理器
$(document).ready(function() {
  // console.log('页面加载完成，开始初始化管理器...');
  
  // 初始化文章管理器
  articleManager = new ArticleManager();
  window.articleManager = articleManager; // 设置为全局变量，供其他管理器使用
  // console.log('文章管理器初始化完成');
  
  // 检查页面是否包含留言板模块
  if ($('.comment-input').length > 0 || $('.comment-item').length > 0) {
    // 初始化留言板管理器
    messageBoardManager = new MessageBoardManager();
    // console.log('留言板管理器初始化完成');
  }
  
  // 显示初始化完成消息
  // console.log('所有管理器初始化完成，页面功能就绪');
});

/**
 * 留言板管理器 - 从老项目重构而来
 * 实现用户留言、回复、点赞等完整功能
 */
function MessageBoardManager() {
  // 私有属性
  this.contentId = '';
  this.messageList = [];
  this.isLoading = false;
  this.replyState = false;
  this.relationMsgId = '';
  this.replyAuthor = '';
  this.currentReplyTarget = null;
  
  // 初始化
  this.init();
}

/**
 * 初始化留言板
 */
MessageBoardManager.prototype.init = function () {
  this.contentId = this.getContentId();
  this.bindEvents();
  this.loadMessages();
};

/**
 * 获取当前内容ID
 */
MessageBoardManager.prototype.getContentId = function() {
  return document.getElementById('post_id').value;
};

/**
 * 绑定留言板事件
 */
MessageBoardManager.prototype.bindEvents = function() {
  var self = this;
  
  // 发表评论事件
  $(document).on('click', '.publish-comment-btn', function(e) {
    e.preventDefault();
    self.publishComment();
  });
  
  // 回复按钮事件
  $(document).on('click', '.reply-btn', function(e) {
    e.preventDefault();
    var $btn = $(this);
    var commentId = $btn.closest('.comment-item').data('comment-id') || 
                    $btn.closest('[data-comment-id]').data('comment-id');
    var userName = $btn.closest('.comment-item').find('.comment-user-name').text() ||
      $btn.closest('[data-comment-id]').find('.comment-user-name').text();
    var userId = $btn.closest('.comment-item').find('.comment-user-name').data('user-id') ||
      $btn.closest('[data-comment-id]').find('.comment-user-name').data('user-id');
    self.startReply(commentId, userName, userId, $btn);
  });
  
  // 点赞按钮事件
  $(document).on('click', '.like-btn', function(e) {
    e.preventDefault();
    var $btn = $(this);
    var commentId = $btn.closest('.comment-item').data('comment-id') ||
                    $btn.closest('[data-comment-id]').data('comment-id');
    self.likeComment(commentId, $btn);
  });
  
  // 取消回复事件
  $(document).on('click', '.cancel-reply-btn', function(e) {
    e.preventDefault();
    self.cancelReply();
  });
  
  // 评论输入框键盘事件
  $(document).on('keydown', '.comment-input', function(e) {
    if (e.ctrlKey && e.keyCode === 13) { // Ctrl+Enter发表评论
      e.preventDefault();
      self.publishComment();
    }
  });
  
  // 查看更多评论
  $(document).on('click', '.load-more-comments-btn', function(e) {
    e.preventDefault();
    self.loadMoreComments();
  });
};

/**
 * 加载评论列表
 */
MessageBoardManager.prototype.loadMessages = function() {
  var self = this;
  
  // 使用现有的apiRequest方法调用真实API (RESTful: GET /api/v1/messages)
  this.apiRequest('/api/v1/messages', {
    method: 'GET',
    data: {
      pageSize: 100,
      contentId: this.contentId
    }
  }).then(function(data) {
    if (data.status === 200) {
      self.messageList = data.data.docs || [];
      self.renderMessages();
      self.updateCommentCount();
    }
  }).catch(function(error) {
    // console.error('加载评论失败:', error);
    self.showMessage('加载评论失败，请刷新页面重试', 'error');
  });
};

/**
 * 渲染评论列表
 */
MessageBoardManager.prototype.renderMessages = function() {
  // 使用准确的选择器定位评论列表容器
  var $container = $('#comment-list');
  if ($container.length === 0) {
    $container = $('.comment-list-container');
  }
  
  // 如果仍然找不到容器，记录错误并返回
  if ($container.length === 0) {
    // console.error('未找到评论列表容器，请检查HTML模板中是否包含 #comment-list 或 .comment-list-container');
    return;
  }
  
  // 清空现有的动态生成的评论（保留示例评论）
  $container.find('.comment-item:not([data-comment-id^="sample"])').remove();
  
  // 渲染新评论到列表顶部（最新评论在上方）
  var self = this;
  var $firstSampleComment = $container.find('.comment-item[data-comment-id^="sample"]:first');
  
  this.messageList.forEach(function(comment) {
    var $commentHtml = self.createCommentHtml(comment);
    $commentHtml.addClass('new-comment'); // 添加新评论的样式类
    
    if ($firstSampleComment.length > 0) {
      // 在第一个示例评论之前插入
      $firstSampleComment.before($commentHtml);
    } else {
      // 如果没有示例评论，则添加到容器开头
      $container.prepend($commentHtml);
    }
  });
  
  // 移除新评论标识（动画完成后）
  setTimeout(function() {
    $container.find('.new-comment').removeClass('new-comment');
  }, 500);
};

/**
 * 创建评论HTML
 */
MessageBoardManager.prototype.createCommentHtml = function(comment) {
  var author = this.getAuthor(comment);
  var replyToAuthor = this.getReplyToAuthor(comment);
  var isAuthor = comment.utype === '1'; // 作者标识
  
  var commentHtml = 
    '<div class="comment-item flex" data-comment-id="' + comment._id + '">' +
      '<img src="' + (author.logo || 'https://cdn.html-js.cn/cms/upload/images/20250601/1748746558512977961.png') + '" alt="评论用户头像" class="w-10 h-10 rounded-full object-cover object-top mr-3" />' +
      '<div class="flex-1">' +
        '<div class="flex items-center mb-1">' +
          '<h4 class="comment-user-name text-sm font-medium mr-2" data-user-id="' + (author._id || '') + '">' + (author.userName || '匿名用户') + '</h4>' +
          (isAuthor ? '<span class="text-xs text-blue-500">作者</span>' : '') +
          '<span class="text-xs text-gray-500 ml-2">' + this.formatDate(comment.createdAt) + '</span>' +
        '</div>' +
        '<p class="text-sm text-gray-800 mb-2">' +
          (replyToAuthor ? '<span class="text-blue-500 mr-2">@' + replyToAuthor.userName + '</span>' : '') +
          this.escapeHtml(comment.content) +
        '</p>' +
        '<div class="flex items-center space-x-4">' +
          '<button class="like-btn flex items-center space-x-1 text-gray-500 hover:text-gray-700 text-xs">' +
            '<div class="w-3.5 h-3.5 flex items-center justify-center">' +
              '<i class="ri-thumb-up-line"></i>' +
            '</div>' +
            '<span class="like-count">' + (comment.praise_num || 0) + '</span>' +
          '</button>' +
          '<button class="reply-btn flex items-center space-x-1 text-gray-500 hover:text-gray-700 text-xs">' +
            '<div class="w-3.5 h-3.5 flex items-center justify-center">' +
              '<i class="ri-reply-line"></i>' +
            '</div>' +
            '<span>回复</span>' +
          '</button>' +
        '</div>' +
        '<div class="reply-container mt-3"></div>' +
      '</div>' +
    '</div>';
  
  return $(commentHtml);
};

/**
 * 发表评论
 */
MessageBoardManager.prototype.publishComment = function() {
  var self = this;
  var $textarea = $('.comment-input');
  var content = $textarea.val().trim();
  
  // 验证评论内容
  if (!content) {
    this.showMessage('请输入评论内容', 'warning');
    $textarea.focus();
    return;
  }
  
  if (content.length < 5) {
    this.showMessage('评论内容至少需要5个字符', 'warning');
    $textarea.focus();
    return;
  }
  
  if (content.length > 200) {
    this.showMessage('评论内容不能超过200个字符', 'warning');
    $textarea.focus();
    return;
  }
  
  // 检查登录状态
  if (!this.isLoggedIn()) {
    this.showMessage('请先登录后再发表评论', 'warning');
    // 跳转到登录页面
    setTimeout(function() {
      window.location.href = '/user-center/login';
    }, 1500);
    return;
  }
  
  // 禁用发表按钮，防止重复提交
  var $publishBtn = $('.publish-comment-btn');
  var originalText = $publishBtn.text();
  $publishBtn.prop('disabled', true).text('发表中...');
  
  // 准备提交数据
  var params = {
    contentId: this.contentId,
    content: content,
    replyAuthor: this.replyAuthor,
    relationMsgId: this.relationMsgId
  };
  
  // 使用现有的apiRequest方法提交评论 (RESTful: POST /api/v1/messages)
  this.apiRequest('/api/v1/messages', {
    method: 'POST',
    data: params
  }).then(function(data) {
    if (data.status === 200) {
      self.showMessage('评论发表成功！', 'success');
      $textarea.val(''); // 清空输入框
      self.cancelReply(); // 取消回复状态
      self.loadMessages(); // 重新加载评论列表
    } else {
      self.showMessage(data.message || '评论发表失败', 'error');
    }
  }).catch(function(error) {
    // console.error('发表评论失败:', error);
    self.showMessage('评论发表失败，请重试', 'error');
  }).always(function() {
    // 恢复发表按钮
    $publishBtn.prop('disabled', false).text(originalText);
  });
};

/**
 * 开始回复评论
 */
MessageBoardManager.prototype.startReply = function(commentId, userName, userId, $btn) {
  var self = this;
  
  // 设置回复状态
  this.replyState = true;
  this.relationMsgId = commentId;
  this.replyAuthor = userId; // 简化处理，实际项目中需要获取用户ID
  this.currentReplyTarget = $btn.closest('.comment-item');
  
  // 更新输入框placeholder
  var $textarea = $('.comment-input');
  $textarea.attr('placeholder', '回复 @' + userName + '...');
  $textarea.focus();
  
  // 显示取消回复按钮
  this.showCancelReplyButton();
  
  // 滚动到输入框
  $('html, body').animate({
    scrollTop: $textarea.offset().top - 100
  }, 300);
};

/**
 * 取消回复
 */
MessageBoardManager.prototype.cancelReply = function() {
  this.replyState = false;
  this.relationMsgId = '';
  this.replyAuthor = '';
  this.currentReplyTarget = null;
  
  // 恢复输入框placeholder
  $('.comment-input').attr('placeholder', '写下你的评论...');
  
  // 隐藏取消回复按钮
  this.hideCancelReplyButton();
};

/**
 * 点赞评论
 */
MessageBoardManager.prototype.likeComment = function(commentId, $btn) {
  var self = this;
  
  // 检查登录状态
  if (!this.isLoggedIn()) {
    this.showMessage('请先登录后再点赞', 'warning');
    return;
  }
  
  // 防止重复点击
  if ($btn.hasClass('liked') || $btn.prop('disabled')) {
    return;
  }
  
  $btn.prop('disabled', true);
  
  // 使用现有的apiRequest方法 (RESTful: POST /api/v1/messages/:id/like)
  this.apiRequest('/api/v1/messages/' + commentId + '/like', {
    method: 'POST'
  }).then(function(data) {
    if (data.status === 200) {
      // 更新点赞状态和数量
      $btn.addClass('liked text-blue-500');
      var $count = $btn.find('.like-count');
      var currentCount = parseInt($count.text()) || 0;
      $count.text(currentCount + 1);
      
      self.showMessage('点赞成功！', 'success');
    } else {
      self.showMessage(data.message || '点赞失败', 'error');
    }
  }).catch(function(error) {
    // console.error('点赞失败:', error);
    self.showMessage('点赞失败，请重试', 'error');
  }).always(function() {
    $btn.prop('disabled', false);
  });
};

/**
 * 加载更多评论
 */
MessageBoardManager.prototype.loadMoreComments = function() {
  var self = this;
  var $btn = $('.load-more-comments-btn');
  
  $btn.prop('disabled', true).text('加载中...');
  
  // 计算下一页页码
  var nextPage = Math.floor(this.messageList.length / 20) + 1;
  if (nextPage === 1) {
    $btn.hide(); 
    return
  }
  // 这里可以实现真实的分页加载逻辑
  this.apiRequest('/api/contentMessage/getMessages', {
    method: 'GET',
    data: {
      pageSize: 20,
      contentId: this.contentId,
      current: nextPage
    }
  }).then(function(data) {
    if (data.status === 200 && data.data.docs && data.data.docs.length > 0) {
      // 将新评论添加到现有列表
      var newComments = data.data.docs;
      self.messageList = self.messageList.concat(newComments);
      
      // 渲染新加载的评论到列表底部
      self.renderMoreComments(newComments);
      self.updateCommentCount();
      self.showMessage('加载成功！', 'success');
      
      // 如果返回的评论数量少于请求的数量，说明没有更多了
      if (newComments.length < 20) {
        $btn.hide(); // 隐藏加载更多按钮
        self.showMessage('已加载全部评论', 'info');
      }
    } else {
      $btn.hide(); // 隐藏加载更多按钮
      self.showMessage('已加载全部评论', 'info');
    }
  }).catch(function(error) {
    // console.error('加载更多评论失败:', error);
    self.showMessage('加载失败，请重试', 'error');
  }).always(function() {
    $btn.prop('disabled', false).text('查看更多评论');
  });
};

/**
 * 渲染更多评论（用于分页加载）
 */
MessageBoardManager.prototype.renderMoreComments = function(comments) {
  var $container = $('#comment-list');
  if ($container.length === 0) {
    $container = $('.comment-list-container');
  }
  
  if ($container.length === 0) {
    // console.error('未找到评论列表容器');
    return;
  }
  
  var self = this;
  var $loadMoreBtn = $('.load-more-comments-btn');
  
  comments.forEach(function(comment) {
    var $commentHtml = self.createCommentHtml(comment);
    $commentHtml.addClass('new-comment');
    
    // 在"查看更多评论"按钮之前插入
    if ($loadMoreBtn.length > 0) {
      $loadMoreBtn.before($commentHtml);
    } else {
      $container.append($commentHtml);
    }
  });
  
  // 移除新评论标识
  setTimeout(function() {
    $container.find('.new-comment').removeClass('new-comment');
  }, 500);
};

/**
 * 显示取消回复按钮
 */
MessageBoardManager.prototype.showCancelReplyButton = function() {
  var $commentInputArea = $('.comment-input').closest('.flex-1');
  var $existingBtn = $commentInputArea.find('.cancel-reply-btn');
  
  if ($existingBtn.length === 0) {
    var cancelBtn = 
      '<button class="cancel-reply-btn px-3 py-1 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded mr-2">' +
        '取消回复' +
      '</button>';
    $commentInputArea.find('.flex.justify-between').prepend(cancelBtn);
  }
};

/**
 * 隐藏取消回复按钮
 */
MessageBoardManager.prototype.hideCancelReplyButton = function() {
  $('.cancel-reply-btn').remove();
};

/**
 * 更新评论数量
 */
MessageBoardManager.prototype.updateCommentCount = function() {
  var count = this.messageList.length;
  $('.comment-count').text(count);
};

/**
 * 获取评论作者信息
 */
MessageBoardManager.prototype.getAuthor = function(comment) {
  if (comment.adminAuthor) {
    return comment.adminAuthor;
  }
  return comment.author || {};
};

/**
 * 获取被回复作者信息
 */
MessageBoardManager.prototype.getReplyToAuthor = function(comment) {
  if (comment.adminReplyAuthor) {
    return comment.adminReplyAuthor;
  }
  return comment.replyAuthor || null;
};

/**
 * 检查用户登录状态
 */
MessageBoardManager.prototype.isLoggedIn = function() {
  // 检查页面中的登录状态标识
  var loginedFlag = $('#logined').val();
  if (loginedFlag === 'true') {
    return true;
  }
  return false;
};

/**
 * 格式化日期
 */
MessageBoardManager.prototype.formatDate = function(dateStr) {
  if (!dateStr) return '刚刚';
  
  var date = new Date(dateStr);
  var now = new Date();
  var diff = now - date;
  
  // 计算时间差
  var minutes = Math.floor(diff / (1000 * 60));
  var hours = Math.floor(diff / (1000 * 60 * 60));
  var days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return minutes + '分钟前';
  if (hours < 24) return hours + '小时前';
  if (days < 7) return days + '天前';
  
  // 超过7天显示具体日期
  return date.toLocaleDateString('zh-CN');
};

/**
 * HTML转义
 */
MessageBoardManager.prototype.escapeHtml = function(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * 显示消息提示 - 使用全局showMessage方法
 */
MessageBoardManager.prototype.showMessage = function(message, type) {
  // 使用全局的articleManager的showMessage方法
  if (window.articleManager && typeof window.articleManager.showMessage === 'function') {
    window.articleManager.showMessage(message, type);
  } else {
    // 后备方案：简单的alert
    alert(message);
  }
};

/**
 * 使用现有的API请求方法
 * 复用ArticleManager中的apiRequest逻辑
 */
MessageBoardManager.prototype.apiRequest = function(url, options) {
  options = options || {};
  var method = options.method || 'GET';
  var data = options.data || {};
  var headers = options.headers || {};
  
  var ajaxOptions = {
    url: url,
    method: method,
    headers: $.extend({
      'Content-Type': 'application/json'
    }, headers)
  };

  if (method.toUpperCase() === 'GET') {
    ajaxOptions.data = data;
  } else {
    ajaxOptions.data = JSON.stringify(data);
  }

  return $.ajax(ajaxOptions).fail(function(error) {
    // console.error('API请求失败:', error);
    throw error;
  });
};