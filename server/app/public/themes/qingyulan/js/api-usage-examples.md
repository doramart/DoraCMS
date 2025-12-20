# API 请求方法使用示例

## 公共请求方法 `apiRequest`

这是一个封装的通用请求方法，支持 GET 和 POST 请求，让代码更简洁和可维护。

### 方法签名

```javascript
async function apiRequest(url, options = {})
```

### 参数说明

- `url` (string): 请求URL
- `options` (Object): 请求配置
  - `method` (string): 请求方法，默认 'GET'
  - `params` (Object): GET请求参数或POST请求体，默认 {}
  - `headers` (Object): 请求头，默认包含 'Content-Type': 'application/json'

### 使用示例

#### 1. GET 请求示例

```javascript
// 获取文章列表
const result = await apiRequest('/api/content/getList', {
  method: 'GET',
  params: {
    model: '1',
    isPaging: '1',
    pageSize: '20',
    current: 1
  }
});

// 获取用户信息
const userInfo = await apiRequest('/api/user/info', {
  method: 'GET',
  params: {
    userId: '123456'
  }
});
```

#### 2. POST 请求示例

```javascript
// 用户登录
const loginResult = await apiRequest('/api/user/login', {
  method: 'POST',
  params: {
    username: 'admin',
    password: '123456'
  }
});

// 创建文章
const createResult = await apiRequest('/api/content/create', {
  method: 'POST',
  params: {
    title: '文章标题',
    content: '文章内容',
    tags: ['JavaScript', 'Node.js']
  }
});
```

#### 3. 自定义请求头

```javascript
// 带认证token的请求
const result = await apiRequest('/api/admin/users', {
  method: 'GET',
  params: { page: 1, limit: 10 },
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token-here'
  }
});
```

#### 4. 错误处理

```javascript
try {
  const result = await apiRequest('/api/content/getList', {
    method: 'GET',
    params: { model: '1' }
  });
  
  if (result.status === 200) {
    console.log('请求成功:', result.data);
  } else {
    console.log('请求失败:', result.message);
  }
} catch (error) {
  console.error('网络错误:', error);
}
```

### 在项目中的实际应用

#### 文章无限滚动加载

```javascript
// 推荐文章加载
async function loadMoreRecommendArticles() {
  await loadMoreArticles('recommend', { model: '1' });
}

// 最新文章加载
async function loadMoreLatestArticles() {
  await loadMoreArticles('latest');
}

// 通用文章加载函数
async function loadMoreArticles(tabType, extraParams = {}) {
  // ... 状态检查和页码更新 ...
  
  const result = await apiRequest('/api/content/getList', {
    method: 'GET',
    params: {
      isPaging: '1',
      pageSize: '20',
      current: currentPage,
      ...extraParams
    }
  });
  
  // ... 处理响应数据 ...
}
```

### 优势

1. **代码复用**: 统一的请求处理逻辑
2. **错误处理**: 统一的错误处理和日志记录
3. **参数处理**: 自动处理GET参数和POST请求体
4. **类型安全**: 完整的JSDoc注释和类型提示
5. **易于维护**: 集中管理请求配置和错误处理
6. **扩展性**: 易于添加拦截器、重试机制等功能

### 注意事项

- GET请求参数会自动转换为URL查询字符串
- POST请求体会自动JSON序列化
- 所有请求都包含默认的JSON Content-Type头
- 网络错误和HTTP错误都会抛出异常，需要使用try-catch处理 