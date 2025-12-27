# 安全检查清单

## 🔒 重要提醒

在构建和发布 CLI 模板时，必须确保**不包含任何敏感信息**。

## ⚠️ 已发现的安全问题

### 问题：生产环境配置文件被复制

**文件**: `server/.env.production`, `client/**/.env.production`

**包含的敏感信息**:
- ❌ 数据库密码
- ❌ Redis 密码
- ❌ JWT 密钥
- ❌ 生产环境域名
- ❌ 服务器路径

**解决方案**: ✅ 已在 `build-templates.js` 中添加排除规则

## 🚫 必须排除的文件

### 1. 生产环境配置

```
❌ .env.production
❌ .env.prod
❌ .env.*.production
❌ .env.*.prod
```

**原因**: 包含真实的生产环境密码和配置

### 2. 本地环境配置

```
❌ .env
❌ .env.local
❌ .env.*.local
```

**原因**: 可能包含开发者的本地配置和密钥

### 3. 其他敏感文件

```
❌ .env.staging
❌ config/secrets.js
❌ config/production.js (如果包含密钥)
❌ *.pem, *.key (SSL 证书和私钥)
❌ .npmrc (如果包含 token)
```

## ✅ 可以保留的文件

### 1. 示例配置文件

```
✅ .env.example
✅ env.example
✅ docker.env.example
```

**要求**: 
- 不包含真实密码
- 使用占位符（如 `your_password_here`）
- 提供配置说明

### 2. 开发环境配置

```
✅ .env.development
✅ .env.test
```

**要求**:
- 只包含开发/测试用的配置
- 不包含生产环境信息
- 使用本地数据库（如 localhost）

## 🔍 安全检查步骤

### 构建前检查

```bash
# 1. 检查是否有生产环境配置文件
find . -name ".env.production" -o -name ".env.prod"

# 2. 检查文件内容是否包含密码
grep -r "password\|PASSWORD" server/.env* client/**/.env* 2>/dev/null | grep -v "example"

# 3. 检查是否有私钥文件
find . -name "*.pem" -o -name "*.key" -o -name "*.p12"
```

### 构建后检查

```bash
cd packages/cli

# 1. 检查模板中是否有敏感文件
find templates/ -name ".env.production" -o -name ".env.prod" -o -name ".env.local"

# 2. 检查模板中的环境文件
find templates/ -name ".env*" -o -name "env.example"

# 3. 搜索可能的密码
grep -r "password.*=" templates/ | grep -v "example\|your_password\|PASSWORD_HERE"
```

### 发布前检查

```bash
# 1. 打包并检查内容
npm pack
tar -tzf doracms-cli-*.tgz | grep -E "\.env|password|secret"

# 2. 检查包大小（异常大可能包含了不该有的文件）
ls -lh doracms-cli-*.tgz
```

## 📋 检查清单

在每次构建和发布前，确认以下项目：

### 构建前

- [ ] 检查 `server/.env.production` 不存在或已被排除
- [ ] 检查 `client/**/.env.production` 不存在或已被排除
- [ ] 检查 `.env.local` 文件不存在或已被排除
- [ ] 检查没有 SSL 证书和私钥文件
- [ ] 检查 `.npmrc` 不包含 token

### 构建后

- [ ] 运行 `find templates/ -name ".env.production"` 返回空
- [ ] 运行 `find templates/ -name ".env.local"` 返回空
- [ ] 检查 `templates/server/env.example` 存在
- [ ] 检查 `env.example` 不包含真实密码
- [ ] 模板大小合理（< 50MB）

### 发布前

- [ ] 运行 `npm pack --dry-run` 检查文件列表
- [ ] 确认 `templates/` 目录被包含
- [ ] 确认 `src/` 目录不被包含
- [ ] 确认 `.git/` 目录不被包含
- [ ] 包大小合理（< 30MB）

## 🛡️ 最佳实践

### 1. 使用环境变量示例文件

**好的做法** ✅:
```bash
# .env.example
DATABASE_PASSWORD=your_password_here
JWT_SECRET=your_secret_key_here
```

**不好的做法** ❌:
```bash
# .env.production
DATABASE_PASSWORD=YoooYu520~~
JWT_SECRET=doracms_prod_jwt_secret_2024_secure
```

### 2. 在 .gitignore 中排除敏感文件

```gitignore
# 环境配置
.env
.env.local
.env.*.local
.env.production
.env.prod

# 密钥文件
*.pem
*.key
*.p12
```

### 3. 定期审查排除规则

每次添加新的配置文件时，检查是否需要更新排除规则。

### 4. 使用自动化检查

在 CI/CD 中添加安全检查：

```yaml
# .github/workflows/security-check.yml
- name: Check for sensitive files
  run: |
    if find . -name ".env.production" | grep -q .; then
      echo "Error: Found .env.production file"
      exit 1
    fi
```

## 🚨 如果敏感信息已泄露

### 立即行动

1. **撤回发布**
   ```bash
   npm unpublish @doracms/cli@<version>
   ```

2. **更改所有密码**
   - 数据库密码
   - Redis 密码
   - JWT 密钥
   - API 密钥

3. **发布修复版本**
   ```bash
   # 修复问题
   npm version patch
   npm publish
   ```

4. **通知用户**
   - 在 GitHub 发布安全公告
   - 建议用户更新到最新版本

### 预防措施

1. **使用密钥管理服务**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault

2. **环境变量注入**
   - 在部署时注入环境变量
   - 不在代码仓库中存储密钥

3. **定期审计**
   - 定期检查代码仓库
   - 使用工具扫描敏感信息（如 git-secrets）

## 📚 相关资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)

---

## ✅ 当前状态

- [x] 已排除 `.env.production`
- [x] 已排除 `.env.prod`
- [x] 已排除 `.env.local`
- [x] 保留 `.env.example`
- [x] 保留 `.env.development`
- [x] 保留 `.env.test`

**最后检查时间**: 2024-12-27  
**检查人**: AI Assistant  
**状态**: ✅ 安全
