/**
 * 评论模块 JavaScript
 * 支持嵌套回复、点赞踩、分页等功能
 */

class CommentModule {
  constructor(config) {
    this.config = {
      contentId: '',
      apiBase: '/api/v1/messages',
      pageSize: 10,
      maxNestLevel: 3,
      ...config,
    };

    this.currentPage = 1;
    this.totalPages = 1;
    this.currentSort = 'latest';
    this.currentUser = null;
    this.comments = [];

    this.init();
  }

  async init() {
    await this.checkUserLogin();
    this.bindEvents();
    await this.loadComments();
  }

  // 检查用户登录状态
  async checkUserLogin() {
    try {
      const response = await fetch('/api/v1/users/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 200 && result.data) {
          this.currentUser = result.data;
          this.showCommentForm();
        } else {
          this.showLoginPrompt();
        }
      } else {
        this.showLoginPrompt();
      }
    } catch (error) {
      console.warn('检查登录状态失败:', error);
      this.showLoginPrompt();
    }
  }

  // 显示评论表单
  showCommentForm() {
    const loginPrompt = document.getElementById('login-prompt');
    const commentForm = document.getElementById('comment-form');
    const userAvatar = document.getElementById('user-avatar');

    loginPrompt.classList.add('hidden');
    commentForm.classList.remove('hidden');

    if (this.currentUser && this.currentUser.logo) {
      userAvatar.src = this.currentUser.logo;
    } else {
      userAvatar.src = '/public/images/default-avatar.png';
    }
  }

  // 显示登录提示
  showLoginPrompt() {
    const loginPrompt = document.getElementById('login-prompt');
    const commentForm = document.getElementById('comment-form');

    loginPrompt.classList.remove('hidden');
    commentForm.classList.add('hidden');
  }

  // 绑定事件
  bindEvents() {
    // 评论内容输入
    const commentContent = document.getElementById('comment-content');
    const charCount = document.getElementById('char-count');
    const submitBtn = document.getElementById('submit-comment');

    if (commentContent) {
      commentContent.addEventListener('input', e => {
        const length = e.target.value.length;
        charCount.textContent = `${length}/200`;
        submitBtn.disabled = length === 0 || length > 200;
      });
    }

    // 提交评论
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
      commentForm.addEventListener('submit', e => {
        e.preventDefault();
        this.submitComment();
      });
    }

    // 排序选择
    const sortSelect = document.getElementById('comment-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', e => {
        this.currentSort = e.target.value;
        this.currentPage = 1;
        this.loadComments();
      });
    }

    // 分页按钮
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.loadComments();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.currentPage < this.totalPages) {
          this.currentPage++;
          this.loadComments();
        }
      });
    }
  }

  // 加载评论列表
  async loadComments(forceRefresh = false) {
    try {
      this.showLoading();

      const params = new URLSearchParams({
        contentId: this.config.contentId,
        current: this.currentPage,
        size: this.config.pageSize,
        sort: this.getSortParam(),
      });

      if (forceRefresh) {
        params.append('refresh', '1');
      }

      const response = await fetch(`${this.config.apiBase}?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('加载评论失败');
      }

      const result = await response.json();

      if (result.status === 200 && result.data && result.data.docs) {
        const docs = result.data.docs || [];
        // 构建父子关系，过滤掉重复的子回复
        const commentMap = new Map();
        docs.forEach(item => {
          commentMap.set(item.id, { ...item, childMessages: item.childMessages || [] });
        });

        const roots = [];
        commentMap.forEach(item => {
          if (item.relationMsgId && commentMap.has(item.relationMsgId)) {
            commentMap.get(item.relationMsgId).childMessages.push(item);
          } else {
            roots.push(item);
          }
        });

        this.comments = roots;
        this.totalPages = result.data.pageInfo.totalPage || 1;
        this.renderComments();
        this.updatePagination();
        this.updateCommentCount(result.data.pageInfo.totalItems || 0);
      } else {
        throw new Error(result.message || '加载评论失败');
      }
    } catch (error) {
      console.error('加载评论失败:', error);
      this.showError('加载评论失败，请稍后重试');
    }
  }

  // 获取排序参数
  getSortParam() {
    const sortMap = {
      latest: 'createdAt_desc',
      oldest: 'createdAt_asc',
      hot: 'praise_num_desc',
    };
    return sortMap[this.currentSort] || 'createdAt_desc';
  }

  // 显示加载状态
  showLoading() {
    document.getElementById('comments-loading').classList.remove('hidden');
    document.getElementById('comments-container').classList.add('hidden');
    document.getElementById('comments-empty').classList.add('hidden');
  }

  // 渲染评论列表
  renderComments() {
    const container = document.getElementById('comments-container');
    const loading = document.getElementById('comments-loading');
    const empty = document.getElementById('comments-empty');

    loading.classList.add('hidden');

    if (this.comments.length === 0) {
      container.classList.add('hidden');
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    container.classList.remove('hidden');
    container.innerHTML = '';

    this.comments.forEach(comment => {
      const commentElement = this.createCommentElement(comment);
      container.appendChild(commentElement);
    });
  }

  // 创建评论元素
  createCommentElement(comment, level = 0) {
    const template = document.getElementById('comment-template');
    const commentElement = template.content.cloneNode(true);
    const commentDiv = commentElement.querySelector('.comment-item');

    // 设置基本信息
    commentDiv.setAttribute('data-comment-id', comment.id);

    // 头像
    const avatar = commentElement.querySelector('.comment-avatar');
    if (comment.author && comment.author.logo) {
      avatar.src = comment.author.logo;
    } else if (comment.adminAuthor && comment.adminAuthor.logo) {
      avatar.src = comment.adminAuthor.logo;
    } else {
      avatar.src = '/public/images/default-avatar.png';
    }

    // 用户名
    const authorName = commentElement.querySelector('.comment-author');
    if (comment.utype === '1' && comment.adminAuthor) {
      authorName.textContent = comment.adminAuthor.userName;
      commentElement.querySelector('.comment-type-badge').classList.remove('hidden');
    } else if (comment.author) {
      authorName.textContent = comment.author.userName;
    }

    // 时间
    const timeElement = commentElement.querySelector('.comment-time');
    timeElement.textContent = this.formatTime(comment.createdAt);

    // 内容
    const contentElement = commentElement.querySelector('.comment-content');
    contentElement.textContent = comment.content;

    // 点赞数
    const praiseBtn = commentElement.querySelector('.praise-btn');
    const praiseCount = commentElement.querySelector('.praise-count');
    praiseCount.textContent = comment.praise_num || 0;

    if (comment.had_praise) {
      praiseBtn.classList.add('active');
    }

    // 踩数
    const despiseBtn = commentElement.querySelector('.despise-btn');
    const despiseCount = commentElement.querySelector('.despise-count');
    despiseCount.textContent = comment.despises_num || 0;

    if (comment.had_despises) {
      despiseBtn.classList.add('active');
    }

    // 回复数
    const replyCount = commentElement.querySelector('.reply-count');
    replyCount.textContent = comment.comment_num || 0;

    // 绑定事件
    this.bindCommentEvents(commentDiv, comment, level);

    // 渲染子评论
    if (comment.childMessages && comment.childMessages.length > 0) {
      const repliesContainer = commentElement.querySelector('.replies-container');
      comment.childMessages.forEach(childComment => {
        const childElement = this.createCommentElement(childComment, level + 1);
        repliesContainer.appendChild(childElement);
      });
    }

    return commentElement;
  }

  // 绑定评论事件
  bindCommentEvents(commentElement, comment, level) {
    const commentId = comment.id;

    // 点赞按钮
    const praiseBtn = commentElement.querySelector('.praise-btn');
    praiseBtn.addEventListener('click', () => {
      this.togglePraise(commentId, praiseBtn);
    });

    // 踩按钮
    const despiseBtn = commentElement.querySelector('.despise-btn');
    despiseBtn.addEventListener('click', () => {
      this.toggleDespise(commentId, despiseBtn);
    });

    // 回复按钮
    const replyBtn = commentElement.querySelector('.reply-btn');
    if (level < this.config.maxNestLevel) {
      replyBtn.addEventListener('click', () => {
        this.showReplyForm(commentElement, comment);
      });
    } else {
      replyBtn.style.display = 'none';
    }

    // 回复表单事件
    this.bindReplyFormEvents(commentElement, comment);
  }

  // 绑定回复表单事件
  bindReplyFormEvents(commentElement, parentComment) {
    const replyForm = commentElement.querySelector('.reply-form');
    const replyContent = commentElement.querySelector('.reply-content');
    const replyCharCount = commentElement.querySelector('.reply-char-count');
    const submitReplyBtn = commentElement.querySelector('.submit-reply');
    const cancelReplyBtn = commentElement.querySelector('.cancel-reply');

    // 回复内容输入
    replyContent.addEventListener('input', e => {
      const length = e.target.value.length;
      replyCharCount.textContent = `${length}/200`;
      submitReplyBtn.disabled = length === 0 || length > 200;
    });

    // 提交回复
    submitReplyBtn.addEventListener('click', () => {
      this.submitReply(parentComment.id, replyContent.value, replyForm);
    });

    // 取消回复
    cancelReplyBtn.addEventListener('click', () => {
      this.hideReplyForm(replyForm);
    });
  }

  // 显示回复表单
  showReplyForm(commentElement, comment) {
    if (!this.currentUser) {
      this.showLoginPrompt();
      return;
    }

    const replyForm = commentElement.querySelector('.reply-form');
    const replyUserAvatar = commentElement.querySelector('.reply-user-avatar');

    // 设置用户头像
    if (this.currentUser.logo) {
      replyUserAvatar.src = this.currentUser.logo;
    } else {
      replyUserAvatar.src = '/public/images/default-avatar.png';
    }

    replyForm.classList.remove('hidden');
    replyForm.querySelector('.reply-content').focus();
  }

  // 隐藏回复表单
  hideReplyForm(replyForm) {
    replyForm.classList.add('hidden');
    replyForm.querySelector('.reply-content').value = '';
    replyForm.querySelector('.reply-char-count').textContent = '0/200';
    replyForm.querySelector('.submit-reply').disabled = true;
  }

  // 提交评论
  async submitComment() {
    if (!this.currentUser) {
      this.showLoginPrompt();
      return;
    }

    const content = document.getElementById('comment-content').value.trim();
    if (!content) return;

    try {
      const response = await fetch(`${this.config.apiBase}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          contentId: this.config.contentId,
          content: content,
          utype: '0',
        }),
      });

      const result = await response.json();

      if (result.status === 200) {
        // 清空表单
        document.getElementById('comment-content').value = '';
        document.getElementById('char-count').textContent = '0/200';
        document.getElementById('submit-comment').disabled = true;

        // 重新加载评论
        this.currentPage = 1;
        await this.loadComments(true);

        this.showMessage('评论发表成功！', 'success');
      } else {
        throw new Error(result.message || '发表评论失败');
      }
    } catch (error) {
      console.error('发表评论失败:', error.message);
      this.showMessage(error.message, 'error');
    }
  }

  // 提交回复
  async submitReply(parentId, content, replyForm) {
    if (!this.currentUser) {
      this.showLoginPrompt();
      return;
    }

    if (!content.trim()) return;

    try {
      const response = await fetch(`${this.config.apiBase}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          contentId: this.config.contentId,
          content: content.trim(),
          relationMsgId: parentId,
          utype: '0',
        }),
      });

      const result = await response.json();

      if (result.status === 200) {
        this.hideReplyForm(replyForm);
        await this.loadComments(true);
        this.showMessage('回复发表成功！', 'success');
      } else {
        throw new Error(result.message || '发表回复失败');
      }
    } catch (error) {
      console.error('发表回复失败:', error);
      this.showMessage('发表回复失败，请稍后重试', 'error');
    }
  }

  // 切换点赞状态
  async togglePraise(commentId, praiseBtn) {
    if (!this.currentUser) {
      this.showLoginPrompt();
      return;
    }

    const isActive = praiseBtn.classList.contains('active');
    const method = isActive ? 'DELETE' : 'POST';

    try {
      const response = await fetch(`${this.config.apiBase}/${commentId}/like`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (result.status === 200) {
        const praiseCount = praiseBtn.querySelector('.praise-count');
        let count = parseInt(praiseCount.textContent) || 0;

        if (isActive) {
          praiseBtn.classList.remove('active');
          praiseCount.textContent = Math.max(0, count - 1);
        } else {
          praiseBtn.classList.add('active');
          praiseCount.textContent = count + 1;
        }
      } else {
        throw new Error(result.message || '操作失败');
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      this.showMessage('操作失败，请稍后重试', 'error');
    }
  }

  // 切换踩状态
  async toggleDespise(commentId, despiseBtn) {
    if (!this.currentUser) {
      this.showLoginPrompt();
      return;
    }

    const isActive = despiseBtn.classList.contains('active');
    const method = isActive ? 'DELETE' : 'POST';

    try {
      const response = await fetch(`${this.config.apiBase}/${commentId}/dislike`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (result.status === 200) {
        const despiseCount = despiseBtn.querySelector('.despise-count');
        let count = parseInt(despiseCount.textContent) || 0;

        if (isActive) {
          despiseBtn.classList.remove('active');
          despiseCount.textContent = Math.max(0, count - 1);
        } else {
          despiseBtn.classList.add('active');
          despiseCount.textContent = count + 1;
        }
      } else {
        throw new Error(result.message || '操作失败');
      }
    } catch (error) {
      console.error('踩操作失败:', error);
      this.showMessage('操作失败，请稍后重试', 'error');
    }
  }

  // 更新分页
  updatePagination() {
    const pagination = document.getElementById('comment-pagination');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageNumbers = document.getElementById('page-numbers');

    if (this.totalPages <= 1) {
      pagination.classList.add('hidden');
      return;
    }

    pagination.classList.remove('hidden');

    // 更新上一页/下一页按钮
    prevBtn.disabled = this.currentPage === 1;
    nextBtn.disabled = this.currentPage === this.totalPages;

    // 生成页码
    pageNumbers.innerHTML = '';
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.className = i === this.currentPage ? 'active' : '';
      pageBtn.addEventListener('click', () => {
        this.currentPage = i;
        this.loadComments();
      });
      pageNumbers.appendChild(pageBtn);
    }
  }

  // 更新评论数量
  updateCommentCount(count) {
    const commentCount = document.getElementById('comment-count');
    commentCount.textContent = `(${count} 条评论)`;
  }

  // 格式化时间
  formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) {
      return '刚刚';
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)} 分钟前`;
    } else if (diff < day) {
      return `${Math.floor(diff / hour)} 小时前`;
    } else if (diff < 7 * day) {
      return `${Math.floor(diff / day)} 天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  }

  // 显示消息
  showMessage(message, type = 'info') {
    // 创建消息提示
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white ${
      type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    messageDiv.textContent = message;

    document.body.appendChild(messageDiv);

    // 3秒后自动移除
    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  }

  // 显示错误
  showError(message) {
    const container = document.getElementById('comments-container');
    const loading = document.getElementById('comments-loading');
    const empty = document.getElementById('comments-empty');

    loading.classList.add('hidden');
    container.classList.add('hidden');
    empty.classList.remove('hidden');
    empty.innerHTML = `
      <svg class="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-red-500 mt-4">${message}</p>
      <button onclick="commentModule.loadComments()" class="mt-2 text-primary hover:text-red-600">重试</button>
    `;
  }
}

// 初始化评论模块
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.CommentConfig !== 'undefined') {
    window.commentModule = new CommentModule(window.CommentConfig);
  }
});
