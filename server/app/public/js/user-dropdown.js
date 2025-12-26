/**
 * 用户下拉菜单交互脚本
 */
document.addEventListener('DOMContentLoaded', function () {
  const userDropdown = document.querySelector('.user-dropdown');
  const dropdownTrigger = document.querySelector('.user-dropdown-trigger');
  const dropdownMenu = document.querySelector('.user-dropdown-menu');
  const dropdownArrow = document.querySelector('.user-dropdown-arrow');

  if (!userDropdown || !dropdownTrigger || !dropdownMenu) {
    return; // 如果用户未登录，这些元素不存在
  }

  let isOpen = false;
  let hoverTimeout;

  // 鼠标进入触发器
  dropdownTrigger.addEventListener('mouseenter', function () {
    clearTimeout(hoverTimeout);
    showDropdown();
  });

  // 鼠标离开整个下拉菜单区域
  userDropdown.addEventListener('mouseleave', function () {
    hoverTimeout = setTimeout(function () {
      hideDropdown();
    }, 150); // 150ms 延迟，避免鼠标快速移动时闪烁
  });

  // 鼠标进入下拉菜单
  dropdownMenu.addEventListener('mouseenter', function () {
    clearTimeout(hoverTimeout);
  });

  // 点击触发器切换显示状态
  dropdownTrigger.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (isOpen) {
      hideDropdown();
    } else {
      showDropdown();
    }
  });

  // 点击页面其他地方关闭下拉菜单
  document.addEventListener('click', function (e) {
    if (!userDropdown.contains(e.target)) {
      hideDropdown();
    }
  });

  // ESC 键关闭下拉菜单
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) {
      hideDropdown();
    }
  });

  // 显示下拉菜单
  function showDropdown() {
    if (isOpen) return;

    isOpen = true;
    dropdownMenu.style.opacity = '1';
    dropdownMenu.style.visibility = 'visible';
    dropdownMenu.style.transform = 'translateY(0)';

    if (dropdownArrow) {
      dropdownArrow.style.transform = 'rotate(180deg)';
    }

    // 添加活跃状态类
    userDropdown.classList.add('dropdown-active');
  }

  // 隐藏下拉菜单
  function hideDropdown() {
    if (!isOpen) return;

    isOpen = false;
    dropdownMenu.style.opacity = '0';
    dropdownMenu.style.visibility = 'hidden';
    dropdownMenu.style.transform = 'translateY(-10px)';

    if (dropdownArrow) {
      dropdownArrow.style.transform = 'rotate(0deg)';
    }

    // 移除活跃状态类
    userDropdown.classList.remove('dropdown-active');
  }

  // 处理退出登录
  const logoutLink = dropdownMenu.querySelector('a[href="/api/v1/auth/logout"], a[href="/api/user/logOut"]');
  if (logoutLink) {
    logoutLink.addEventListener('click', function (e) {
      e.preventDefault();

      // 显示确认对话框
      if (confirm('确定要退出登录吗？')) {
        // 发送退出登录请求 (v1 API)
        fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
        })
          .then(response => {
            if (response.ok) {
              // 退出成功，刷新页面或跳转到首页
              window.location.href = '/';
            } else {
              throw new Error('退出登录失败');
            }
          })
          .catch(error => {
            console.error('退出登录错误:', error);
            // 即使请求失败，也尝试跳转到首页
            window.location.href = '/';
          });
      }
    });
  }

  // 键盘导航支持
  dropdownMenu.addEventListener('keydown', function (e) {
    const menuItems = dropdownMenu.querySelectorAll('a');
    const currentIndex = Array.from(menuItems).indexOf(document.activeElement);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
        menuItems[nextIndex].focus();
        break;

      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
        menuItems[prevIndex].focus();
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (document.activeElement) {
          document.activeElement.click();
        }
        break;
    }
  });
});
