# Vercel 部署快速指南

## 方法 1：通过 GitHub（推荐）

### 步骤 1：推送代码到 GitHub

```bash
# 如果还没有 Git 仓库，先初始化
git init

# 添加所有文件
git add .

# 提交
git commit -m "Add wechat jump test feature"

# 关联远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 推送
git push -u origin main
```

### 步骤 2：在 Vercel 部署

1. 访问 [https://vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择你刚刚推送的仓库
5. Vercel 会自动检测到这是 Vite 项目
6. 点击 "Deploy"
7. 等待部署完成，获取你的 HTTPS 链接

## 方法 2：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 在项目目录下运行
vercel

# 按照提示操作：
# - 登录 Vercel 账号
# - 确认项目设置
# - 选择部署环境（Production）
```

## 方法 3：拖拽部署

1. 运行 `npm run build` 生成 dist 目录
2. 访问 [https://vercel.com/new](https://vercel.com/new)
3. 将 dist 文件夹拖拽到页面
4. 等待部署完成

## 获取部署链接

部署成功后，Vercel 会给你一个链接，格式类似：

- `https://your-project-name.vercel.app`
- `https://your-project-name-xxxxx.vercel.app`

## 手机测试步骤

1. **用手机浏览器访问**部署链接
2. 页面会自动尝试跳转微信（延迟 1.5 秒）
3. 如果自动跳转失败，点击"点击跳转微信"按钮
4. 观察跳转效果

### 不同环境测试

- **Safari / Chrome**：可能会弹出确认对话框
- **抖音 App**：将链接发到抖音私信中打开
- **钉钉 App**：将链接发到钉钉聊天中打开

## 环境变量设置（可选）

如果需要在 Vercel 中设置环境变量：

1. 进入项目设置（Settings）
2. 选择 "Environment Variables"
3. 添加变量：
   - Name: `VITE_WECHAT_SCHEME`
   - Value: `weixin://dl/business/?t=你的token`
4. 重新部署

## 常见问题

### Q1: 部署后页面空白？

**解决方案：**
- 检查构建是否成功
- 查看浏览器控制台是否有错误
- 确认 vercel.json 配置正确

### Q2: 在抖音中无法跳转？

**原因：** Vercel 的域名默认不在抖音的白名单中

**解决方案：**
- 尝试在系统浏览器中测试
- 考虑使用自定义域名
- 参考 DEPLOYMENT.md 中的说明

### Q3: Scheme 失效？

**原因：** URL Scheme 可能已过期

**解决方案：**
- 修改 `src/App.tsx` 中的 `wechatScheme`
- 使用微信官方接口动态生成新的 scheme

### Q4: 跳转后打开的不是我的小程序？

**原因：** 示例中使用的是测试 scheme

**解决方案：**
- 需要替换为你自己小程序的 scheme
- 通过微信官方 API 生成（需要后端服务）

## 查看部署日志

```bash
vercel logs
```

## 重新部署

### GitHub 自动部署
每次推送到 main 分支，Vercel 会自动重新部署

### 手动重新部署
```bash
vercel --prod
```

## 自定义域名（可选）

1. 在 Vercel 项目设置中选择 "Domains"
2. 添加你的自定义域名
3. 按照提示配置 DNS
4. 等待 DNS 生效

## 删除项目

1. 进入项目设置
2. 拉到最下方
3. 点击 "Delete Project"

## 更多帮助

- [Vercel 文档](https://vercel.com/docs)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)

