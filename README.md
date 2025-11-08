# 微信跳转测试项目

这是一个基于对"天天外链"等服务的技术探索，实现的微信小程序跳转测试页面。

## ✨ 功能特性

- 🔍 **环境检测**：自动识别抖音、钉钉、微信、浏览器等环境
- 🚀 **自动跳转**：页面加载后自动尝试跳转微信
- 🔄 **多重尝试**：支持多种跳转方式（location、window.open、iframe、a标签）
- 📱 **移动优化**：响应式设计，适配各种屏幕尺寸
- 🎯 **降级处理**：跳转失败时提供手动按钮等备用方案
- 📊 **调试信息**：显示详细的环境和跳转信息

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 部署到 Vercel

1. **通过 CLI 部署：**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **通过 GitHub：**
   - 将代码推送到 GitHub
   - 在 Vercel 中导入项目
   - 点击部署

详细部署指南请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📱 手机测试

1. 部署后获得 HTTPS 链接（如：`https://your-project.vercel.app`）
2. 用手机浏览器访问
3. 观察自动跳转效果
4. 如果自动跳转失败，点击"点击跳转微信"按钮

## ⚙️ 配置修改

在 `src/App.tsx` 中修改配置：

```typescript
const config = {
  wechatScheme: "weixin://dl/business/?t=你的token", // 修改这里
  autoJumpDelay: 1500, // 自动跳转延迟（毫秒）
  retryCount: 3 // 重试次数
}
```

## 🔧 技术栈

- React 18.3
- TypeScript 5.5
- Vite 5.4
- CSS3

## 📝 技术原理

本项目基于对"天天外链"服务的技术分析，实现了类似的跳转机制：

1. **URL Scheme**：使用微信的 `weixin://dl/business/?t=xxx` 协议
2. **环境适配**：针对不同平台采用不同策略
3. **自动化流程**：页面加载 → 环境检测 → 自动跳转 → 失败重试

详细的技术探索过程记录在 `chat.md` 文件中。

## ⚠️ 注意事项

1. **域名限制**：某些 App（如抖音）需要域名白名单才能成功跳转
2. **Scheme 时效**：示例中的 scheme 可能已过期，实际应用需要动态生成
3. **平台差异**：不同平台的 WebView 策略不同，成功率会有差异
4. **合规使用**：请确保符合微信和各平台的使用规范

## 📂 项目结构

```
vite-react/
├── src/
│   ├── App.tsx          # 主应用组件
│   ├── App.css          # 应用样式
│   ├── main.tsx         # 入口文件
│   └── index.css        # 全局样式
├── public/              # 静态资源
├── index.html           # HTML 模板
├── vercel.json          # Vercel 配置
├── DEPLOYMENT.md        # 部署指南
└── package.json         # 项目配置
```

## 🎯 测试效果预期

| 环境 | 预期效果 | 成功率 |
|------|----------|--------|
| 系统浏览器 | 弹出确认对话框 | 中等 |
| 抖音内置浏览器 | 可能被拦截 | 较低* |
| 钉钉内置浏览器 | 可能直接跳转 | 较高 |
| 微信内置浏览器 | 显示"已在微信中" | N/A |

\* 除非域名在白名单中

## 🔍 调试技巧

1. 查看页面顶部的环境信息
2. 查看页面底部的调试信息区域
3. 打开浏览器开发者工具查看控制台
4. 多次点击按钮会轮换不同的跳转方式

## 📚 参考资料

- [微信 URL Scheme 文档](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/url-scheme.html)
- [微信 URL Link 文档](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/url-link.html)
- [探索过程记录](./chat.md)

## 🚧 后续扩展

- [ ] 添加后端服务，动态生成微信 URL Link
- [ ] 实现数据统计功能
- [ ] 支持二维码展示
- [ ] 添加 iOS Universal Link 支持
- [ ] 实现域名轮换策略

## 📄 许可证

MIT

## ⚠️ 免责声明

本项目仅用于技术学习和测试目的。使用者需确保符合相关平台的使用规范，不得用于违规导流或其他违法用途，需自行承担使用风险。
