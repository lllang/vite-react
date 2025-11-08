# 微信跳转测试项目 - 部署指南

## 项目说明

这是一个用于测试从各种环境（抖音、钉钉、浏览器等）跳转到微信小程序的测试页面。基于对"天天外链"等服务的技术探索，实现了类似的跳转功能。

## 技术原理

1. **环境检测**：通过 User Agent 检测当前运行环境（抖音、钉钉、微信、浏览器等）
2. **自动跳转**：页面加载后自动尝试通过微信 URL Scheme 跳转
3. **多种跳转方式**：支持 location、window.open、iframe、a标签点击等多种跳转方式
4. **降级处理**：跳转失败时提供手动按钮和复制链接等备用方案

## 快速部署到 Vercel

### 方式一：通过 Vercel CLI

1. 安装 Vercel CLI：
```bash
npm install -g vercel
```

2. 在项目根目录运行：
```bash
vercel
```

3. 按照提示完成部署

### 方式二：通过 GitHub

1. 将代码推送到 GitHub 仓库

2. 登录 [Vercel](https://vercel.com)

3. 点击 "Import Project"

4. 选择你的 GitHub 仓库

5. Vercel 会自动检测到这是一个 Vite 项目并配置构建设置

6. 点击 "Deploy"

## 本地测试

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 在浏览器中打开显示的本地地址（通常是 http://localhost:5173）

## 在手机上测试

### 测试步骤

1. 部署到 Vercel 后，你会得到一个 HTTPS 链接，例如：`https://your-project.vercel.app`

2. 使用手机浏览器访问这个链接

3. 页面会自动尝试跳转微信（延迟 1.5 秒）

4. 如果自动跳转失败，可以点击页面上的"点击跳转微信"按钮

### 不同环境的测试效果

- **系统浏览器（Safari/Chrome）**：
  - ✅ 可以尝试跳转，但可能会提示"打开微信"确认
  - 成功率：中等

- **抖音内置浏览器**：
  - ⚠️ 可能被拦截，需要域名白名单
  - 成功率：较低（除非域名在白名单中）

- **钉钉内置浏览器**：
  - ✅ 某些版本可能直接跳转
  - 成功率：较高

- **微信内置浏览器**：
  - ❌ 会检测到微信环境，显示"已在微信中"
  - 不需要跳转

## 修改跳转目标

如果你想修改跳转到的小程序，需要修改 `src/App.tsx` 中的配置：

```typescript
const config = {
  // 修改这里的 URL Scheme
  wechatScheme: "weixin://dl/business/?t=你的token",
  autoJumpDelay: 1500,
  retryCount: 3
}
```

**注意**：
- URL Scheme 需要从微信官方接口动态生成
- 示例中的 scheme 可能已过期
- 真实应用需要后端服务来生成有效的 scheme

## 限制和注意事项

1. **域名限制**：
   - 在某些 App（如抖音）内，需要域名在白名单中才能成功跳转
   - Vercel 提供的域名默认可能不在白名单中

2. **URL Scheme 时效性**：
   - 示例中使用的 `weixin://dl/business/?t=tLriEynor9d` 可能已过期
   - 真实应用需要通过微信接口动态生成

3. **平台限制**：
   - iOS 对 URL Scheme 的限制较严
   - 不同 App 的 WebView 策略不同

4. **合规性**：
   - 请确保符合微信和各平台的使用规范
   - 避免用于违规导流

## 环境变量配置（可选）

如果需要配置环境变量，可以在 Vercel 项目设置中添加：

- `VITE_WECHAT_SCHEME`：微信跳转 scheme

然后在代码中使用：
```typescript
const wechatScheme = import.meta.env.VITE_WECHAT_SCHEME || "weixin://dl/business/?t=tLriEynor9d"
```

## 调试技巧

1. 查看页面顶部的环境信息，了解当前运行环境

2. 查看调试信息区域，显示：
   - 当前使用的 Scheme
   - 尝试跳转的次数

3. 打开浏览器开发者工具（移动端可以通过 Safari 或 Chrome 的远程调试）

4. 查看控制台日志了解跳转过程

## 后续扩展建议

1. **添加后端服务**：
   - 实现动态生成微信 URL Link
   - 存储和管理跳转数据

2. **数据统计**：
   - 记录跳转成功率
   - 分析不同环境的表现

3. **多方案支持**：
   - 添加二维码展示
   - 支持 URL Link（Universal Link）
   - 实现应用宝中转（Android）

4. **防封策略**：
   - 域名轮换
   - 添加中间跳转页

## 技术栈

- React 18
- TypeScript
- Vite 5
- CSS3（响应式设计）

## 参考资料

- [微信官方文档 - URL Scheme](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/url-scheme.html)
- [微信官方文档 - URL Link](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/url-link.html)

## 问题反馈

如果在使用过程中遇到问题，可以：
1. 查看浏览器控制台的错误信息
2. 检查网络请求
3. 确认手机已安装微信
4. 尝试不同的跳转方式（多次点击按钮会轮换不同方法）

## 免责声明

本项目仅用于技术学习和测试目的。使用者需要：
- 确保符合相关平台的使用规范
- 不得用于违规导流或其他违法用途
- 自行承担使用风险

