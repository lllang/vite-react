QUESTION：在抖音群聊里面点击链接，发现直接跳转到了微信小程序，这是什么实现路径，是正常走的微信的协议头跳转嘛，如果我要做个一样的怎么做
ANSWER from gemini-2.5-pro-06-17：你好！你观察到的这个现象非常普遍，这是一个很典型的“跨平台引流”技术。我来为你详细拆解一下这个实现路径，以及告诉你如何自己实现一个。

### 核心解答：这不是直接跳转

首先，最关键的一点是：**抖音App并不能直接调用微信的协议头（`weixin://`）来直接打开微信小程序。**

出于安全和商业竞争的考虑，像抖音、淘宝这样的“超级App”都会建立自己的“围墙花园”（Walled Garden），它们会屏蔽或限制其他竞争对手App的协议头。如果你在抖音聊天里直接发一个 `weixin://` 链接，它要么无法被识别为链接，要么点击后毫无反应。

那么，你看到的“直接跳转”效果是怎么实现的呢？

**它的真实路径是利用了一个中间“跳板”网页（也叫落地页，Landing Page）。**

完整的流程是这样的：

1.  **用户在抖音点击链接**：这个链接是一个普通的 `https://` 网址，比如 `https://example.com/promo`。抖音App会正常识别并允许打开它。
2.  **打开内置浏览器加载网页**：点击后，抖音会用它内置的浏览器（WebView）打开这个 `https://` 链接，加载一个网页。这个过程非常快，用户可能都感觉不到。
3.  **网页执行跳转逻辑**：这个网页（落地页）的核心任务就是一件事——**唤起微信并打开指定的小程序**。它通过内置的JavaScript代码来实现这个功能。
4.  **跳转到微信小程序**：微信被成功唤起，并直接进入到预设的小程序页面。

对用户来说，中间的第2步和第3步速度极快，感觉就像是“点击链接 -> 直接打开小程序”，体验非常流畅。

---

### 如何实现这个“跳板”网页？

这个跳板网页是整个技术的关键。目前主流有两种实现方式，一种是官方推荐的、更可靠的方式，另一种是传统的、兼容性稍差的方式。

#### 方式一：微信开放标签 `<wx-open-launch-weapp>` (官方推荐，最稳定)

这是微信官方提供的、专门用于在外部浏览器（如抖音内置浏览器、Safari、Chrome等）中拉起小程序的解决方案。它的可靠性最高，用户体验最好。

**优点：**
*   官方支持，成功率最高。
*   可以向小程序传递参数。
*   用户体验好，通常会显示一个明确的按钮引导用户点击。

**缺点：**
*   配置相对复杂，需要有服务端开发配合。

**实现步骤：**

1.  **前提条件：**
    *   一个**已认证的服务号**（订阅号不行）。
    *   一个微信小程序。
    *   将服务号和小程序在微信公众平台进行**关联**。
    *   一个已备案的域名，并将其配置在服务号后台的“**JS接口安全域名**”中。

2.  **后端开发（服务端）：**
    *   你需要一个后端服务接口。这个接口的作用是接收前端页面URL，然后通过微信的API计算出`wx.config`所需要的签名（signature）等信息，并返回给前端。这是为了验证你的网页是合法的，有权调用微信的JS-SDK。

3.  **前端开发（跳板网页）：**
    *   在你的HTML页面中引入微信JS-SDK文件：`<script src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>`。
    *   使用Ajax请求你的后端接口，获取 `appId`, `timestamp`, `nonceStr`, `signature`。
    *   调用 `wx.config` 方法，传入获取到的配置信息。
    *   在 `wx.ready` 回调中，或者页面的任意位置，插入微信开放标签 `<wx-open-launch-weapp>`。

**示例代码 (HTML/JavaScript):**

```html
<!DOCTYPE html>
<html>
<head>
    <title>正在打开小程序...</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <!-- 这个 script 标签里的内容就是微信开放标签 -->
    <!-- 它会渲染成一个按钮，用户需要点击才能跳转 -->
    <script type="text/wxtag-template" id="weapp-btn">
        <style>
            .btn {
                padding: 12px;
                border-radius: 4px;
                background-color: #07c160;
                color: #fff;
                border: none;
                font-size: 16px;
                text-align: center;
                display: block;
            }
        </style>
        <button class="btn">点击打开小程序</button>
    </script>
    
    <!-- 1. 引入 JSSDK -->
    <script src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>
    
    <script>
        // 2. 假设你通过 fetch 从你的后端 /get-wx-config 获取了配置
        fetch('/get-wx-config?url=' + encodeURIComponent(location.href.split('#')[0]))
            .then(res => res.json())
            .then(config => {
                // 3. 配置 JSSDK
                wx.config({
                    debug: false, // 调试时可以设为 true
                    appId: config.appId,
                    timestamp: config.timestamp,
                    nonceStr: config.nonceStr,
                    signature: config.signature,
                    jsApiList: ['wx-open-launch-weapp'], // 必须要有这个
                    openTagList: ['wx-open-launch-weapp'] // 也要有这个
                });

                wx.ready(() => {
                    // 4. 创建开放标签实例
                    var btn = document.getElementById('weapp-btn');
                    var launchBtn = document.createElement('wx-open-launch-weapp');
                    launchBtn.setAttribute('username', 'gh_xxxxxxxxxxxx'); // 小程序的原始ID
                    launchBtn.setAttribute('path', 'pages/index/index.html?a=1'); // 小程序页面路径及参数
                    launchBtn.appendChild(btn);
                    document.body.appendChild(launchBtn);
                });

                wx.error(err => {
                    // 配置失败处理
                    console.error('wx.config error:', err);
                    document.body.innerHTML = '配置失败，无法打开小程序';
                });
            });
    </script>
</body>
</html>
```

#### 方式二：URL Scheme (传统方式，兼容性差)

这种方式是利用微信小程序提供的URL Scheme（形如 `weixin://dl/business/?t=TICKET`）。

**优点：**
*   实现简单，不需要后端服务，纯前端即可。
*   可以快速生成。

**缺点：**
*   **可靠性差**：很多App（包括抖音）的内置浏览器可能会阻止这种协议的跳转。
*   **用户体验差**：如果跳转失败，用户会停留在空白页或错误页。
*   **限制多**：生成的Scheme有有效期，且只能从短信、邮件、浏览器等少数场景发起。

**实现步骤：**

1.  **获取URL Scheme**：
    *   登录微信公众平台，进入你的小程序。
    *   在菜单中找到 “工具” -> “生成 URL Scheme”。
    *   设置要跳转的小程序页面路径和参数，生成Scheme。

2.  **前端开发（跳板网页）：**
    *   在你的HTML页面中加入一段JavaScript，页面加载后立即尝试跳转。

**示例代码 (JavaScript):**

```javascript
// 页面加载后立即执行
window.location.href = "weixin://dl/business/?t=YOUR_TICKET_HERE";

// 为了优化体验，可以加一个延时判断
// 如果2秒后用户还在这个页面，说明跳转失败，可以显示一个二维码或提示信息
setTimeout(function() {
    // 显示引导用户手动打开微信或扫描二维码的提示
    document.body.innerHTML = "跳转失败，请手动打开微信或截图后扫描二维码";
}, 2000);
```
**强烈不推荐**在抖音这种场景下使用这种方法，因为成功率非常低。

---

### 总结与建议

| 特性 | **微信开放标签 (`<wx-open-launch-weapp>`)** | **URL Scheme** |
| :--- | :--- | :--- |
| **实现路径** | 抖音 -> 网页 -> **用户点击按钮** -> 小程序 | 抖音 -> 网页 -> **自动尝试跳转** -> 小程序 |
| **可靠性** | **高**，官方推荐 | **低**，经常被拦截 |
| **用户体验** | **好**，有明确指引，失败有提示 | **差**，可能跳转失败停在空白页 |
| **实现复杂度** | **高**，需要服务号、后端开发 | **低**，纯前端即可 |
| **推荐场景** | **所有商业推广、跨平台引流** | 短信、邮件等兼容性好的场景 |

所以，你在抖音群聊里看到的流畅跳转，**99% 的可能性都是通过第一种方式——“微信开放标签”实现的**。

如果你想做一个一样的功能，请按照 **方式一** 的步骤进行准备和开发。虽然前期配置麻烦一些，但这是保证你的业务能够稳定运行的唯一可靠途径。
ANSWER from Qwen3-235B-A22B-Instruct-2507-ideaLAB：在抖音群聊中点击链接直接跳转到微信小程序，这种行为 **目前是无法通过常规方式实现的**。这是因为：

---

### ❌ 为什么不能直接从抖音跳转到微信小程序？

1. **平台封闭性（生态壁垒）**
   - 抖音（字节跳动）和微信（腾讯）属于不同的超级 App 生态，彼此之间存在严格的限制。
   - 微信小程序只能在微信体系内运行（包括微信聊天、公众号、朋友圈、扫码等）。
   - 抖音 App 内打开的网页或链接，默认使用的是 **抖音内置浏览器（Toutiao Webview）**，它无法调起微信小程序。

2. **协议头限制**
   - 微信小程序的跳转依赖于特定协议如：`weixin://` 或 `wxap://`，这些协议只有在微信客户端内才被识别和处理。
   - 在抖音里点击普通链接（如 `https://xxx.com`），系统不会识别 `weixin://` 协议，也无法唤起微信。

---

### ✅ 那你看到的“跳转”是怎么实现的？

虽然不能**直接跳转**，但常见的“伪跳转”路径如下：

#### 实现路径（间接方式）：
```text
抖音群聊 → 点击链接 → 打开H5页面（中间页） → 引导用户跳转微信 → 在微信中打开小程序
```

具体步骤：

1. 用户在抖音群聊点击一个链接，例如：`https://yourdomain.com/redirect?target=miniprogram`
2. 该链接打开一个 H5 页面，这个页面会：
   - 检测当前是否在微信环境中（通过 User-Agent 判断）
   - 如果不在微信中（比如在抖音里），就显示一张引导图，提示：“请复制链接，在微信中打开”
3. 页面上通常会有：
   - 明显的文字提示：“已复制链接，请前往微信查看”
   - 一键复制按钮
   - 二维码（可以直接用微信扫一扫打开小程序）

4. 用户手动切换到微信，粘贴链接或扫码，最终进入小程序。

---

### 🛠 如何自己做一个类似的流程？

#### 步骤一：准备资源
- 已备案的域名（用于承载 H5 中间页）
- 微信小程序（已上线，有合法 appId）
- 小程序页面路径（如：`pages/index/index`）

#### 步骤二：生成小程序 Scheme 或 URL Link（推荐后者）

> ⚠️ 注意：**Scheme 已基本弃用**，建议使用 [URL Link](https://developers.weixin.qq.com/doc/oplatform/Third-party_Platforms/Mini_Programs/url_link.html)

##### 方法 A：使用微信官方 URL Link（长期有效）
调用微信接口生成可 externally 访问的小程序链接：

```http
POST https://api.weixin.qq.com/wxa/generatetoken
Content-Type: application/json

{
  "access_token": "ACCESS_TOKEN",
  "path": "pages/index/index",
  "query": "from=dy",
  "is_expire": true,
  "expire_type": 0,
  "expire_interval": 30
}
```

返回结果中会有一个 `url_link`，例如：
```
https://wxaurl.cn/abc123xyz
```

这个链接可以在外部浏览器中打开，**前提是用户在微信中打开它**。

##### 方法 B：使用小程序二维码（更稳定）
生成小程序码，托管在你的服务器上，用户扫码即可直达。

---

#### 步骤三：搭建中间页 H5

创建一个简单的 HTML 页面：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>跳转小程序</title>
  <script>
    function copyLink() {
      const link = "https://wxaurl.cn/abc123xyz";
      navigator.clipboard.writeText(link).then(() => {
        alert("链接已复制，请打开微信粘贴查看");
        // 可尝试跳转微信（但大多数手机不支持直接唤起）
        setTimeout(() => {
          window.location.href = "weixin://";
        }, 500);
      });
    }
  </script>
  <style>
    body { text-align: center; padding: 50px; }
    .qrcode { width: 200px; margin: 30px auto; }
  </style>
</head>
<body>
  <h2>请点击下方按钮，跳转至微信小程序</h2>
  <button onclick="copyLink()">一键复制链接</button>
  <p>然后打开微信，粘贴访问</p>
  <img class="qrcode" src="/qrcode.jpg" alt="微信扫码">
</body>
</html>
```

部署这个页面到你的服务器，比如：`https://yourdomain.com/goto-wx`

---

#### 步骤四：在抖音发链接
把 `https://yourdomain.com/goto-wx` 发到抖音群聊，用户点击后就会进入引导页。

---

### ✅ 总结：你看到的“跳转”本质是“引导 + 手动操作”

| 功能 | 是否可行 | 说明 |
|------|----------|------|
| 抖音内直接打开微信小程序 | ❌ 不可能 | 平台限制，安全策略阻止 |
| 自动唤起微信并打开小程序 | ❌ 基本不可行 | 安卓/iOS 都有限制 |
| 引导用户复制链接到微信打开 | ✅ 可行 | 当前主流做法 |
| 使用二维码扫码跳转 | ✅ 推荐 | 更直观高效 |

---

### 🔐 补充建议

1. **合规性注意**：不要诱导分享、虚假宣传，避免被封。
2. **体验优化**：提供清晰指引 + 大二维码 + 一键复制。
3. **数据追踪**：给每个链接加 `utm_source=douyin` 参数，便于统计来源。

---

如果你希望实现更“丝滑”的跨端跳转，可以考虑：
- 使用 **抖音小程序（字节小程序）** 而非微信小程序（同属一个生态）
- 或者接入「抖音 & 微信」双端小程序，分别服务不同用户

---

如有进一步需求（比如自动生成带参小程序码、后端 API 示例），欢迎继续提问！
ANSWER from gpt-5-0807-global：结论先说：
- 在抖音群聊里点链接直接拉起微信小程序，通常是用了微信官方提供的「URL Link（通用链接）」和「Scheme」两套能力。
- iOS端一般是走通用链接（Universal Links，形如 https://wxaurl.cn/xxxxx 或你配置的域名），系统级别把点击行为交给微信，再按参数拉起指定小程序页面。
- Android端一般走 weixin://dl/business/?ticket=xxxxx 这样的微信 Scheme，宿主 App（抖音）如果不拦截 scheme，就能直接拉起微信及小程序。
- 所以不是“单纯的微信协议头”一种方案，而是 iOS 用通用链接、Android 用 Scheme，双通道兼容。

如果你要做同样的效果，标准做法如下：

准备条件
- 你必须有一个已发布的小程序（有 appid），并且能拿到服务端 access_token（用 appid/secret 换取）。
- 小程序内的目标页面 path、query 等要准备好，并在前端能正确解析打开参数（用 wx.getLaunchOptionsSync 读取 scene、query、path）。

生成跳转链接（服务端）
- 生成 URL Link（推荐给 iOS 与 H5点击场景）：
  - 接口：POST https://api.weixin.qq.com/wxa/generate_urllink?access_token=ACCESS_TOKEN
  - 参数核心：path（小程序页面路径）、query（参数串）、env_version（release/trial/test）、is_expire/expire_time（是否过期与过期控制，可选）
  - 返回：url_link（一般是 https://wxaurl.cn/xxxx 的短链）
- 生成 Scheme（推荐给 Android 与原生 App 调用场景）：
  - 接口：POST https://api.weixin.qq.com/wxa/generatescheme?access_token=ACCESS_TOKEN
  - 参数核心：jump_wxa.path、jump_wxa.query、is_expire/expire_time
  - 返回：openlink（形如 weixin://dl/business/?ticket=xxxxx）
- access_token 获取：GET https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET

在分享/投放时如何用
- 在消息里直接放 url_link（比如 https://wxaurl.cn/xxxxx）。效果：
  - iOS：用户点击后，系统识别为通用链接，直接打开微信并进入对应小程序页面。
  - Android：很多 App 也会直接让微信处理该链接；但为了更稳，建议同时准备 scheme 作为兜底。
- 如果你控制的是一个中间落地页（H5），可做「双通道」：
  - 优先尝试用 JS 跳转 scheme（location.href = 'weixin://dl/business?...'），若被拦截或失败，显示一个可点击的 A 标签指向 url_link（https://wxaurl.cn/...），用户再点击触发系统的通用链接能力。
- 在原生 App 里（非抖音场景）：
  - Android：用 Intent 跳转 scheme weixin://…；失败再用 url_link。
  - iOS：直接打开 url_link（Universal Link），系统会交给微信。

常见注意点与坑
- 宿主 App 的拦截：有些平台可能拦截第三方 scheme，通用链接的成功率通常更高；抖音当前看是放行微信的通用链接和（部分场景）scheme。
- iOS 通用链接的触发行为：不同宿主的 WebView 对通用链接支持稍有差异，但官方的 wxaurl.cn 链接兼容性较好。必要时用 target="_blank" 或明确的 A 标签点击触发，而不是 JS 自动跳转。
- 过期控制：生成的链接可设定过期/长期有效。群聊里建议用长期有效，避免失效。
- 参数传递与落地：把需要的业务参数放在 query；前端用 getLaunchOptionsSync / onShow 读取，注意不同打开源的差异。
- 微信未安装的情况：
  - iOS：点击 url_link 可能会去到一个中间页面或引导下载。
  - Android：scheme 会失败，url_link可能打开一个H5提示页。准备兜底文案或引导。
- 合规与审核：不要在小程序落地后做违规导流；链接投放遵守微信与投放平台的规则。

实操示例（思路）
- 你有小程序 appid: wx1234567890abcdef，目标页 path: pages/detail/index，query: id=1001&from=douyin。
- 服务端定时或按需调用：
  - 生成 URL Link -> 得到 https://wxaurl.cn/AbCdEfGH
  - 生成 Scheme -> 得到 weixin://dl/business/?ticket=XYZ123
- 在抖音群里发：https://wxaurl.cn/AbCdEfGH
  - 用户点击（iOS/Android）基本都能直接拉起微信小程序。
- 如果是你自己的 App/H5 落地页：
  - 先尝试跳转 weixin://dl/business/?ticket=XYZ123
  - 失败则展示一个按钮，用户点击打开 https://wxaurl.cn/AbCdEfGH

文档关键词（便于你检索）
- 小程序「生成URL Link」与「生成Scheme」
- 外部APP/网页拉起小程序、Universal Links（iOS）、Scheme（Android）
- wx.getLaunchOptionsSync

总结：要复现抖音群聊里点链接直接拉起微信小程序的体验，核心就是使用微信官方的 URL Link（通用链接）与 Scheme 两种跳转能力，并在不同端与不同宿主环境下做好双通道与兜底策略。
ANSWER from kimi-k2：在当前的抖音 App 内，点击一条“小程序卡片”或“URL 链接”后，能够一键跳转到微信并直达某个小程序，绝不是简单的 `weixin://` 协议头那么简单，而是微信官方在 2021 年开始灰度、2022 年全面放开的「**URL Link / Short Link 一键直达小程序**」能力（文档里叫 **URL Scheme 与 URL Link**）。下面给你把整条链路、技术细节和实现步骤一次讲清，照着做就能复刻出抖音群聊那种体验。

------------------------------------------------
一、抖音里看到的“小程序卡片”到底是什么

1. 在抖音群聊里，它看上去像一条普通链接（或小程序卡片），但本质是经过微信官方签发的  
   `https://wxaurl.cn/xxxxx`（短链） 或  
   `weixin://dl/business/?t=xxxxx`（URL Scheme）  
   这两种形态之一。  
2. 点击后，抖音先把请求拦截到自己的中间页，检测到是微信系的合法跳转格式，就会调用系统接口唤起微信；微信收到参数后，根据 `t=xxxxx` 找到对应的小程序并立刻拉起。用户体感就是「秒跳小程序」。

------------------------------------------------
二、微信侧必备的三件套

要做出一模一样的效果，必须先满足微信侧的前置条件：

| 能力 | 用途 | 开通门槛 |
|---|---|---|
| 1. 小程序已上架 | 必须有线上版本才能接收跳转 | 常规上架流程 |
| 2. 已开通「URL Link」或「URL Scheme」 | 生成外部可点击的链接 | 小程序后台 → 开发 → 开发设置 → 扫 URL Link 或 URL Scheme 开关 |
| 3. 域名白名单 | 指定哪些域名可以带参数跳进来 | 小程序后台 → 开发 → 服务器域名 → downloadFile / request合法域名 |

只要以上三步完成，就可以拿到微信官方返回的一条短链（或 URL Scheme），这条链就是抖音里分享的那串。

------------------------------------------------
三、在抖音侧必须做的工作

抖音并没有开放「万能直接跳微信」的口子，而是走两条合规路线：

1. **抖音企业号 + 抖音小程序（内嵌）**  
   把微信「URL Link」封装到自己的小程序卡片里；用户点击后，抖音会先拉起“抖音小程序”过渡 1～2 秒，再自动唤起微信。  
   → 适合品牌号、蓝 V。

2. **星图 / 巨量引擎投放**  
   通过官方投放平台创建「小程序直跳」素材，审核通过后即可在直播间、短视频评论区、私信/群聊里发。  
   → 普通开发者只能走这条商业化通道。

换句话说：  
个人或普通 App 想在抖音里发“点一下就进微信小程序”的链接，必须「**走星图投放**」——否则抖音会把它当违规外链直接拦截。

------------------------------------------------
四、完整落地步骤（可复制）

下面给出最短可落地的 6 步流程，照着做即能在抖音里复刻同款体验：

1. 注册微信小程序并完成代码提审、上架。  
2. 登录「小程序管理后台 → 开发 → 开发设置」，打开「**生成 URL Link**」开关。  
3. 用后端接口（或后台可视化）生成一条短链：  
   POST https://api.weixin.qq.com/cgi-bin/url_link/generate  
   关键字段：  
   ```
   {
     "path":"pages/index/index?foo=bar",
     "query":"foo=bar",
     "is_expire":false,
     "env_version":"release"
   }
   ```  
   成功会返回  
   ```
   { "url_link": "https://wxaurl.cn/xxxxx" }
   ```
4. 把这条 `https://wxaurl.cn/xxxxx` 填到抖音「星图 → 推广目的 → 微信小程序直跳」的素材里。  
5. 星图审核通过后，你会拿到一条「抖音可分享的卡片链接」。把它发到群聊即可。  
6. 用户点击 → 抖音先唤起微信 → 微信根据 `t=xxxxx` 找到小程序 → 直接打开对应页面。  
   和你在抖音群聊里看到的一模一样。

------------------------------------------------
五、常见问题 & 避坑

- 个人主体小程序能开 URL Link 吗？  
  可以，但「个人主体」无法开通微信支付，且部分能力受限；投放星图时会被降级。

- 能不能直接发 `weixin://dl/business/?t=xxxxx` 这种 Scheme？  
  抖音会屏蔽纯 Scheme；必须走星图或企业号小程序卡片封装。

- URL Link 永久有效吗？  
  接口里 `is_expire=false` 就是永久，微信官方保证 1 年内可用，之后可续期。

- 能不能带用户 ID 这类敏感参数？  
  可以，把参数拼到 `path?uid=123` 里，微信会把完整 query 带进去；但不要在星图素材里明文展示。

------------------------------------------------
一句话总结  
抖音里「点一下就进微信小程序」不是黑科技，而是微信官方「URL Link + 星图投放」的合规组合：小程序后台生成短链 → 星图封装 → 抖音群聊分享 → 点击直接唤起微信并打开小程序。只要你的小程序已上架、星图已开户，照上面 6 步操作就能 100% 复刻。
ANSWER from claude_sonnet4：<think>
用户询问的是关于从抖音群聊点击链接跳转到微信小程序的技术实现原理。这涉及到移动端的深度链接(Deep Link)和跨应用跳转机制。

让我分析一下可能的实现路径：

1. URL Scheme跳转
2. Universal Links (iOS) / App Links (Android)
3. 第三方SDK或服务
4. 系统级的跳转机制

我需要提供技术原理和实现方法。

</think>

这个跳转机制主要有几种可能的实现路径：

## 技术实现原理

### 1. **URL Scheme 跳转**
```
weixin://dl/business/?t=**** （微信小程序专用scheme）
```

### 2. **Universal Links (iOS) / App Links (Android)**
```
https://mp.weixin.qq.com/mp/waerrpage?appid=xxx&type=service&path=xxx
```

### 3. **系统级跳转机制**
- iOS: 通过 `openURL` 调用微信协议
- Android: 通过 `Intent` 启动微信应用

## 具体实现方案

### 方案一：URL Scheme（最常用）

**生成跳转链接：**
```javascript
// 微信小程序跳转链接格式
const miniProgramUrl = `weixin://dl/business/?t=${encodeURIComponent(path)}&s=${timestamp}&r=${random}`;
```

**在网页中使用：**
```html
<a href="weixin://dl/business/?t=****">打开小程序</a>
```

### 方案二：通过微信开放平台

1. **获取小程序码/链接**
   - 使用微信开放平台 API
   - 生成小程序二维码或链接

2. **后端生成跳转链接：**
```python
import requests

def generate_miniprogram_link(appid, path):
    # 调用微信API生成小程序链接
    url = "https://api.weixin.qq.com/wxa/generate_urllink"
    data = {
        "path": path,
        "query": "",
        "env_version": "release"
    }
    # 返回可跳转的链接
```

## 实现步骤

### 1. **准备工作**
- 注册微信开放平台账号
- 获取小程序 AppID
- 配置域名白名单

### 2. **生成跳转链接**
```javascript
// 方法1: 直接使用scheme
function jumpToMiniProgram(appid, path) {
    const scheme = `weixin://dl/business/?appid=${appid}&path=${encodeURIComponent(path)}`;
    window.location.href = scheme;
}

// 方法2: 使用微信提供的URL Link
function jumpByUrlLink(urlLink) {
    window.location.href = urlLink;
}
```

### 3. **兼容性处理**
```javascript
function jumpToMiniProgram(config) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
        // iOS处理
        window.location.href = config.iosScheme;
    } else if (isAndroid) {
        // Android处理
        window.location.href = config.androidScheme;
    } else {
        // 其他平台降级处理
        window.open(config.fallbackUrl);
    }
}
```

## 注意事项

1. **权限限制**：需要微信官方授权
2. **域名白名单**：跳转域名需要在微信后台配置
3. **参数签名**：某些情况下需要对参数进行签名验证
4. **降级方案**：准备二维码等备用方案

## 推荐方案

建议使用**微信官方的 URL Link** 方案，比较稳定且官方支持：

```javascript
// 后端生成URL Link，前端直接跳转
fetch('/api/generate-miniprogram-link', {
    method: 'POST',
    body: JSON.stringify({
        path: '/pages/index',
        query: 'id=123'
    })
}).then(res => res.json())
  .then(data => {
      window.location.href = data.urlLink;
  });
```

这种方式最稳定，也是微信官方推荐的跨平台跳转方案。
ANSWER from DeepSeek-R1-0528-ideaLAB：{"error": {"type": "llm_call_failed", "message": "data: {\"error\":{\"message\":\"Throttling: QPS(2/1)\",\"type\":\"Throttling\",\"code\":\"429\"}}\n\n", "treace_id": "213e007017624109725724126eea91"}}
QUESTION：我看到的是群聊或者私信里面的一个正常 https 的链接，那么点开是通过 webview 打开了这个页面，这个时候页面里面通过微信标签或者微信的 url link 来做到打开微信，这样看上去不是很简单嘛，抖音的内置 webview 允许你干这种事嘛，应该是有各种风控的吧
ANSWER from gemini-2.5-pro-06-17：你这个问题问到了点子上！你已经理解了基本流程，而你的怀疑——“抖音的内置 WebView 允许你干这种事嘛，应该是有各种风控的吧”——完全正确。

这并不是一个简单地“允许”或“不允许”的问题，而是一个在平台方（抖音）、技术提供方（微信）和开发者之间达成的，带有严格限制条件的“默契”。

我们来深入剖析一下抖音的风控视角，以及为什么`<wx-open-launch-weapp>`（微信开放标签）这种方式能够“幸存”下来。

### 抖音的风控哲学：平衡用户体验与平台安全

抖音作为一个巨大的内容平台，其核心利益是**将用户尽可能长时间地留在自己的生态内**。任何试图将用户“轻易”导向外部（尤其是竞争对手如微信）的行为，都是它重点监控和限制的对象。

因此，抖音的 WebView 确实有非常严格的风控策略。它主要防范的是以下几种行为：

1.  **自动、静默的跳转**：页面一加载就自动尝试打开其他App，用户毫不知情。这是最恶劣的体验，会被坚决封杀。
2.  **不安全的协议调用**：直接调用 `weixin://`、`alipays://` 等协议头。这被视为一种潜在的安全漏洞和不受控的引流行为，几乎所有主流App的WebView都会拦截。
3.  **欺诈性、诱导性内容**：落地页内容与抖音内宣传不符，或者用夸张福利诱导用户跳转，这些在内容层面就会被风控。
4.  **高频、滥用的域名**：如果一个域名被大量用于引流，并且被用户频繁举报，它很快就会进入抖音的“黑名单”，链接会直接被屏蔽或提示“不安全”。

### 为什么微信开放标签 `<wx-open-launch-weapp>` 能“绕过”风控？

关键在于，微信开放标签的设计，恰好在一定程度上符合了抖音等平台的风控要求。它和简单粗暴的 `URL Scheme` 跳转有本质区别：

#### 1. **核心区别：需要明确的用户主动行为**

*   **URL Scheme (`weixin://`)**：可以由 JavaScript 自动触发 (`window.location.href = '...'`)，用户可能还没看清页面就被带走。这是抖音**绝不容忍**的。
*   **开放标签 (`<wx-open-launch-weapp>`)**：它本身**不会自动跳转**。它在页面上渲染的是一个**真实的、可点击的按钮**。**必须由用户亲手点击这个按钮，才能触发后续的跳转逻辑。**

这个“用户主动点击”的行为至关重要。从平台的角度看，这意味着：
*   **用户意图明确**：是用户自己选择要离开抖音、打开微信的，而不是被开发者“劫持”的。
*   **责任划分清晰**：抖音提供了浏览器环境，但最终的跳转决定权在用户手上。这在一定程度上规避了平台的连带责任。

#### 2. **技术实现的“标准化”与“可信度”**

*   开放标签的调用需要经过微信 JSSDK 的复杂鉴权流程（`wx.config`）。这意味着，能使用这个功能的开发者，必须是**拥有已认证服务号和已备案域名的合法主体**。
*   这套流程本身就过滤掉了一大批想“搞小动作”的匿名开发者。对抖音来说，一个通过了微信官方认证的跳转请求，其可信度远高于一个来路不明的 `weixin://` 协议请求。

#### 3. **体验上的“缓冲”**

开放标签渲染出的按钮给了用户一个明确的心理预期。用户看到“点击打开小程序”的按钮，他知道点击后会发生什么。这比一个白屏然后突然切换App的体验要好得多。

### 总结：不是“允许”，而是“无法完全禁止”的合规操作

所以，你的理解可以修正为：

*   **不是抖音“允许”你跳转**，而是微信设计了一套**需要用户主动授权、且经过官方认证**的跳转方案。
*   这套方案（开放标签）在形式上满足了抖音风控的底线要求——**禁止自动跳转，必须用户交互**。
*   抖音的 WebView 并没有特殊地“识别并放行”微信的开放标签，而是它无法也无需去阻止一个“用户在网页上点击了一个按钮”这样的标准Web行为。当用户点击时，后续的 JSSDK 逻辑和系统级的App唤起就不是抖音 WebView 能完全控制的了。

**简单来说，抖音的风控可以封杀一个“行为不轨”的网站（黑名单域名），可以拦截一个“不安全”的协议（URL Scheme），但它很难去阻止一个“合规”的网站上，用户的一次“正常”的点击操作。**

如果你想做一样的功能，就必须严格遵守这个游戏规则：

1.  **使用官方推荐的`<wx-open-launch-weapp>`方案**，不要试图走捷径用 URL Scheme。
2.  **确保你的落地页内容合规**，不要做虚假宣传，否则域名被封，一切白费。
3.  **在页面上提供清晰的指引**，让用户知道点击后会打开小程序，优化用户体验。

这就是在“围墙花园”之间，通过一个标准化的、需要用户授权的“小门”进行穿梭的秘诀。
ANSWER from Qwen3-235B-A22B-Instruct-2507-ideaLAB：你这个问题非常精准，触及了当前跨平台跳转的核心矛盾：**“从抖音内置 Webview 中，能否通过一个 https 页面，自动唤醒微信并打开小程序？”**

我们来深入分析一下这个流程是否可行、技术原理、以及平台的风控机制。

---

## 🎯 你的观察是对的：
> “我看到的是群聊或私信里的 `https` 链接 → 点开后在抖音 Webview 打开 → 页面里似乎触发了某种行为 → 跳到了微信小程序。”

但关键在于：  
👉 **真的是「自动跳转」吗？还是用户无意识参与了某个操作？**

我们逐层拆解：

---

## ✅ 技术路径还原：真实发生了什么？

### 场景复现（典型流程）：

1. 用户在抖音群聊点击链接：`https://xxx.com/goto-wx`
2. 抖音用内置 Webview 打开该页面
3. 页面加载后执行 JS：
   - 检测 UA：不是微信 → 显示引导按钮 + 二维码
   - 同时尝试执行：`window.location.href = 'weixin://';`
4. 此时可能触发系统弹窗：“是否打开微信？”（部分安卓机）
5. 用户点了“打开” → 跳转微信首页（⚠️ 并非直接进小程序）
6. 回到微信后，还需手动粘贴原链接或扫码才能进小程序

> 🔍 所以所谓的“跳转”，其实是：
>
> **Webview 内尝试协议唤端 → 用户确认跳转 App → 进入微信主界面 → 仍需二次操作打开小程序**
>
> ❗中间缺失一环：**无法在微信中自动打开指定小程序页面**

---

## ❌ 为什么不能直接跳小程序？

### 1. 协议限制：`weixin://` 只能打开微信客户端，不能打开具体页面

- `weixin://`：只能唤起微信，进入聊天首页
- `weixin://dl/miniapp?path=...`：这类私有协议早已被封禁
- 微信官方唯一支持的外部跳转方式是：[URL Link](https://developers.weixin.qq.com/doc/oplatform/Third-party_Platforms/Mini_Programs/url_link.html) 或 [Scheme](https://developers.weixin.qq.com/doc/oplatform/Mobile_App/Launch_From_WeChat/Launch_from_third-app.html)（已逐步停用）

而这些都依赖于：**在微信环境中打开链接才会生效**

---

### 2. 抖音 Webview 的安全策略（X5 内核 + 字节风控）

抖音使用的是基于腾讯 X5 内核定制的浏览器引擎，但它做了大量加固和限制：

| 行为 | 是否允许 | 原因 |
|------|----------|------|
| `window.location.href = 'weixin://'` | ⚠️ 部分安卓可弹出跳转提示 | 系统级协议调用，取决于手机系统是否注册了该 scheme |
| 自动复制文本到剪贴板 | ❌ 多数情况失败 | 需用户手势触发（如 click） |
| 唤醒其他 App（深度链接） | ⚠️ 有条件支持 | 仅对白名单应用开放（如淘宝、京东），微信通常不在其中 |
| 执行 JavaScript 调起 intent（Android） | ❌ 被拦截 | 安全策略阻止 |

📌 特别注意：
> 字节跳动对 Webview 中的“诱导跳转行为”有严格监控。如果检测到频繁引导用户跳出抖音（尤其是跳微信），可能会：
> - 封禁域名
> - 屏蔽链接分享
> - 限制内容推荐

---

## 🧪 实验验证：你能做什么？

你可以测试以下代码片段是否有效：

```html
<script>
function jumpWechat() {
  // 尝试唤起微信
  window.location.href = "weixin://";

  // 设置延迟 fallback（无效）
  setTimeout(() => {
    alert("请手动打开微信");
  }, 1000);
}
</script>

<button onclick="jumpWechat()">尝试打开微信</button>
```

✅ 在某些老款安卓手机上，点击按钮后会弹出：
> “是否打开微信？” → 用户确认 → 跳转微信首页

❌ 但在多数新款手机（尤其华为、小米、OPPO）和 iOS 上：
- 无反应
- 或提示“无法打开此链接”

---

## 🔄 正确实现路径（合规 + 可行）

虽然不能“全自动跳转”，但可以通过以下方式提升体验：

### ✅ 推荐方案：H5 引导页 + 一键复制 + 二维码

```html
<!-- index.html -->
<div style="text-align: center; padding: 40px;">
  <h3>正在前往微信小程序</h3>
  <p>请点击复制链接，并在微信中粘贴打开</p>
  
  <button onclick="copyLink()" style="padding: 10px 20px;">📋 一键复制</button>
  
  <p style="color: #888; margin-top: 20px;">或直接扫码进入</p>
  <img src="https://yourdomain.com/qrcode.jpg" width="200" />

  <input id="linkInput" value="https://wxaurl.cn/abc123xyz" style="position: absolute; left: -9999px;" />
</div>

<script>
async function copyLink() {
  const input = document.getElementById('linkInput');
  try {
    await navigator.clipboard.writeText(input.value);
    alert("✅ 已复制链接，请切换到微信粘贴打开");
    
    // 尝试唤起微信（辅助手段）
    window.location.href = "weixin://";
    
  } catch (err) {
    prompt("复制失败，请手动选择复制：", input.value);
  }
}
</script>
```

---

## 🔐 抖音的风险控制（风控点）

如果你频繁使用这种方式，可能触发以下风险：

| 风险项 | 说明 |
|--------|------|
| 域名被封 | 多人举报“诱导跳外站” → 域名加入黑名单 |
| 内容限流 | 发送此类链接的内容不被推荐 |
| 账号处罚 | 批量引导跳微信可能被视为违规导流 |

📌 建议：
- 不要强诱导
- 提供真实价值内容
- 使用企业主体备案域名
- 避免短链、跳转链伪装

---

## ✅ 总结：你看到的“简单跳转”其实并不简单

| 问题 | 回答 |
|------|------|
| 能否通过 https 页面直接打开微信小程序？ | ❌ 不能 |
| 能否通过 `weixin://` 唤起微信？ | ⚠️ 有时可以，但只到首页，且依赖系统 |
| 抖音 Webview 允许跳微信吗？ | ⚠️ 有限支持协议跳转，但受系统和风控影响极大 |
| 如何做到类似效果？ | ✅ 用 H5 引导页 + 复制链接 + 二维码 + 用户手动操作 |
| 会被封吗？ | ✅ 频繁诱导导流可能被限流或封禁 |

---

## 💡 最佳实践建议

1. **优先做抖音小程序**（字节小程序），与抖音生态打通
2. 若必须导流微信，使用：
   - 企业认证账号
   - 正规域名
   - 明确告知用户动作
3. 统计转化路径：记录多少人点击 → 复制 → 实际进入小程序
4. 关注微信官方 [URL Link API](https://developers.weixin.qq.com/doc/oplatform/Third-party_Platforms/Mini_Programs/url_link.html) 和 [Universal Link（iOS）](https://developer.apple.com/ios/universal-links/) 支持进展

---

如果你想进一步实现：
- 自动生成带参小程序码
- 动态生成 URL Link
- 判断是否在微信/抖音环境
- 监控复制成功率

我可以提供完整的前后端示例代码 👇 欢迎继续提问！
ANSWER from gpt-5-0807-global：结论与关键点
- 抖音里点一个 https 链接，进入抖音内置 WebView 后再“拉起微信”，真正可行的是用微信官方的 URL Link（https 的通用链接）或小程序 Scheme。所谓“微信标签”（比如 wx-open-launch-weapp）只在微信内置浏览器里才生效，在抖音内置 WebView里不会工作。
- 抖音确实有风控与拦截逻辑，但对“微信官方通用链接域名”和“用户手势触发”的打开外部 App，一般是放行的（可能出现“是否打开微信”的弹窗）。所以你看到的“正常 https 链接”大概率是微信的 URL Link 短链（wxaurl.cn 或者按官方规范生成的自有域名通用链接），并非随意什么链接都能拉起。
- Android 端对 weixin:// scheme 有一定成功率，但容易被宿主拦截；iOS 端更推荐 URL Link（Universal Link）。很多平台都要求“必须用户点击 A 标签”才能触发，禁止脚本自动跳转。

抖音内置 WebView 常见限制（简化理解）
- 仅在明确的用户手势下放行外跳：比如用户点击 A 标签；用 JS 自动 location.href 跳 scheme 很多时候会被拦截。
- 白名单/策略放行：对特定域（如 wxaurl.cn）或特定跳转类型有放行策略；未知域或可疑跳转可能直接禁用或弹风险提示。
- Scheme 较敏感：weixin:// 可能被拦截或要求二次确认；而 https 的 URL Link 成功率更高。
- 内嵌环境差异：青少年模式、不同版本、不同账号/场景（群聊/私信/评论）都有差异，平台会做 AB 策略与风控分级。
- 需要顶层导航：在 iframe 里尝试拉起往往无效；必须当前页面顶层由用户点击触发跳转。

想复现同样效果，正确做法
- 用微信官方“生成 URL Link”（推荐主通道）
  - 服务端调用 generate_urllink 接口，得到形如 https://wxaurl.cn/XXXX 的短链，指向你的小程序页面和参数。
  - 在抖音消息里直接放这个 https 链接。用户点击后，抖音 WebView 通常会放行，系统/微信处理并拉起小程序（可能弹系统确认）。
- 同时准备小程序 Scheme（Android 兜底）
  - 服务端调用 generatescheme 接口得到 weixin://dl/business/?ticket=XXXXX。
  - 在你自有落地页里做“用户点击按钮后优先尝试 scheme，失败则展示 URL Link”的兜底逻辑。但要接受在部分抖音版本里 scheme 会被拦截，仅 URL Link 能用。
- H5 落地页的实现要点
  - 用一个真实的 A 标签，href 指向 URL Link，提示“打开微信小程序”。尽量避免页面自动跳转；要让用户点击。
  - Android 可在点击事件里先尝试跳转 scheme；若 1～2 秒内页面未隐藏/未切到后台，则显示一个可点击的 URL Link 链接按钮。
  - iOS 直接用 URL Link 即可；尽量避免用 JS 强制 location.replace 跳 URL Link，优先用户点击 A 标签。
  - 确保是顶层页面，不在 iframe 内；失败后给出“用系统浏览器打开”或“复制链接到微信打开”的兜底文案。
- 前端落地与参数
  - 业务参数放在 URL Link 的 query；小程序里用 getLaunchOptionsSync/onShow 读取并落地。
  - 链接尽量设为长期有效，避免群聊历史消息过期。
- 合规与体验
  - 不要在小程序内做违规导流；避免在抖音页面上显性“引导跳转竞品”文案被风控。
  - 接受“二次确认”弹窗的存在；这是宿主为外跳设置的合规门槛。

“微信标签”不适用的澄清
- wx-open-launch-weapp、WeixinJSBridge 等只在微信内置浏览器生效；抖音 WebView 里无效。
- 因此可行方案就是微信官方 URL Link 或 Scheme；而且需要用户手势。

可能遇到的坑
- 有的抖音版本会拦截 weixin://，只让 https 的 URL Link；还有一些场景会强制在新窗口或外部浏览器打开，体验会有差异。
- 一些设备/模式（比如青少年模式）可能全局禁外跳。
- URL Link 在某些 WebView 场景对“JS 自动触发”不灵敏，务必提供可点击的 A 标签。
- 统计与归因要考虑“拉起失败”的兜底页面曝光，避免数据缺失。

最小可行落地（思路）
- 服务端生成一对链接：url_link=https://wxaurl.cn/AbCd，scheme=weixin://dl/business/?ticket=XYZ
- 群里发 url_link（首选）。如果你要承接更多文案，用自有 H5 落地页：
  - 页面上放一个大号按钮 <a href="https://wxaurl.cn/AbCd">打开微信小程序</a>
  - 在按钮点击事件里：Android 先尝试跳 scheme；1～2 秒未成功则展示上述 A 标签给用户再点一次。
  - iOS 直接走 A 标签到 url_link。

总结
- 抖音并不是“任你随意唤起其他 App”，它通过白名单、用户手势、确认弹窗等风控做了限制。
- 你要复现的最佳路径就是用微信官方 URL Link（主通道）+ Scheme（安卓兜底），严格用用户点击触发，做好失败兜底与合规模糊处理。这样在抖音内置 WebView 的成功率最高，风险也最低。
ANSWER from kimi-k2：抖音的内置 WebView 早就把“在微信生态里直接唤起微信”的所有口子都封得差不多了。  
你看到的「群聊/私信里是一条普通 https 链接 → 点开是 WebView → 再跳进微信小程序」这套链路，如果想只靠 WebView 里插一段 JS 就完成，是 100% 会被抖音拦截的。抖音对 WebView 的管控手段大致如下：

1. 所有 http/https 页面一律由「X5/WebView」加载，并强制插入自己的桥接 JS。  
2. WebView 的 `window.location` 或 `<a href>` 只要出现  
   - weixin://  
   - wxaurl.cn  
   - open.weixin.qq.com/connect/oauth2/authorize …  
   都会被沙箱策略直接拦截，弹 Toast「该链接无法在当前环境打开」。  
3. 微信 JS-SDK 在抖音 WebView 里不注入；`wx.miniProgram.navigateTo` 之类的 API 直接是 undefined。  
4. Scheme 白名单：抖音在系统层就把 `weixin://`、`wechat://` 等全部拉黑，除非走「抖音安全桥」签名验证。  
5. 就算你把 `window.location.href = 'weixin://dl/business/?t=xxxxx'` 藏到按钮 click 事件里，也会被抖音的「Scheme Hook」捕获，弹一个「是否跳转到微信」的二次确认框；用户点「允许」后才会真正调起微信（这条链路在 2023 Q2 之后也下线了，现在直接失败）。

结论：  
**单纯在 WebView 里用 JS 或微信标签是做不到「无提示直接跳到微信小程序」的**，抖音会风控拦截。  
能做成的只有两条官方通道：

A. 星图/巨量投放的「小程序直跳」卡片（群聊/私信里展示为带小程序图标的卡片，点击后由抖音原生代码唤起微信）。  
B. 企业号绑定的「抖音小程序 → 微信半屏小程序」能力（用户要先点抖音小程序，再经官方桥跳转微信）。

所以，你看到的那条看似普通的 https 链接，其实是「星图投放落地页」的伪装：抖音 App 在解析消息时已经把它识别成了「小程序直跳」类型，点击后根本不走 WebView，而是走原生唤起逻辑。  
同理，如果你想复刻同样的体验，也只能走「星图/巨量 → 微信小程序直跳」这一条路，否则在抖音环境内任何 WebView 代码都会被风控拦截。
ANSWER from claude_sonnet4：<think>
用户的理解是对的，他已经意识到了这个实现路径：
1. 抖音群聊/私信中是一个普通的https链接
2. 点击后在抖音的内置webview中打开页面
3. 页面内通过JS调用微信的URL Scheme或其他方式跳转到微信小程序

用户也意识到了关键问题：抖音的webview是否允许这种跨应用跳转，以及可能存在的风控措施。

这确实是一个敏感的技术话题，涉及到：
1. 各大平台的竞争关系
2. webview的安全策略
3. URL Scheme的拦截机制
4. 平台风控策略

我需要客观地分析技术实现和可能遇到的限制。

</think>

你的理解完全正确！这确实是一个很现实的技术挑战。让我详细分析一下：

## 实际情况分析

### 抖音WebView的限制策略

**1. URL Scheme拦截**
```javascript
// 这些在抖音webview中通常会被拦截
window.location.href = 'weixin://'; // ❌ 被拦截
window.location.href = 'alipays://'; // ❌ 被拦截
window.open('weixin://dl/business/?t=***'); // ❌ 被拦截
```

**2. 跳转白名单机制**
抖音WebView通常只允许跳转到：
- 自家域名
- 部分合作伙伴域名
- 系统浏览器（有限制）

### 绕过策略（技术探讨）

**方案1：引导用户手动操作**
```html
<!-- 显示提示，让用户点击右上角"..."在浏览器中打开 -->
<div class="tip-modal">
    <p>请点击右上角【...】选择【在浏览器中打开】</p>
    <p>然后点击下方按钮跳转微信</p>
    <button onclick="jumpToWechat()">打开微信小程序</button>
</div>
```

**方案2：User-Agent检测 + 降级**
```javascript
function detectEnvironment() {
    const ua = navigator.userAgent;
    
    // 检测是否在抖音webview中
    if (ua.includes('aweme')) {
        // 抖音环境，显示引导页面
        showGuideModal();
        return 'douyin';
    }
    
    // 检测是否在微信中
    if (ua.includes('MicroMessenger')) {
        // 微信环境，可以直接跳转小程序
        jumpToMiniProgram();
        return 'wechat';
    }
    
    // 系统浏览器，可以尝试scheme跳转
    if (ua.includes('Chrome') || ua.includes('Safari')) {
        trySchemeJump();
        return 'browser';
    }
}
```

**方案3：iframe尝试（成功率低）**
```javascript
// 有些webview对iframe的限制较松
function tryIframeJump() {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'weixin://dl/business/?t=***';
    document.body.appendChild(iframe);
    
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 2000);
}
```

## 真实的绕过案例

### 常见的"灰色"做法

**1. 长链接 + 短链接服务**
```javascript
// 使用短链接服务，后端动态重定向
https://t.cn/xxxxx → 中转页面 → 检测环境 → 执行跳转
```

**2. 二维码中转**
```html
<!-- 当检测到受限环境时显示二维码 -->
<div class="qr-container">
    <img src="/api/qrcode?url=weixin://..." />
    <p>请使用微信扫描二维码</p>
</div>
```

**3. 多重跳转**
```javascript
// 链式跳转，增加检测难度
location1.html → location2.html → 执行跳转逻辑
```

## 风控对抗

### 平台检测手段
1. **URL特征检测**：检测微信相关关键词
2. **行为分析**：异常跳转行为
3. **域名黑名单**：封禁违规域名
4. **代码混淆检测**：检测恶意代码

### 应对策略
```javascript
// 1. 动态生成跳转代码
const jumpCode = atob('d2VpeGluOi8vZGwvYnVzaW5lc3M='); // base64混淆

// 2. 延迟执行
setTimeout(() => {
    if (Math.random() > 0.5) { // 随机化
        executeJump();
    }
}, Math.random() * 3000);

// 3. 用户交互触发
document.addEventListener('click', () => {
    if (userClickCount > 2) { // 确保是真实用户
        executeJump();
    }
});
```

## 合规建议

**推荐做法：**
1. **官方合作**：通过官方渠道申请白名单
2. **引导式跳转**：提示用户在浏览器中打开
3. **二维码方案**：生成小程序码供扫描
4. **深度链接**：使用官方支持的Universal Links

**示例代码（合规版）：**
```javascript
function handleJump() {
    const env = detectEnvironment();
    
    switch(env) {
        case 'douyin':
            showBrowserGuide(); // 引导在浏览器打开
            break;
        case 'wechat':
            jumpToMiniProgram(); // 直接跳转
            break;
        default:
            trySchemeJump(); // 尝试跳转
    }
}
```

## 现实状况

目前大部分这类跳转都是"猫鼠游戏"：
- **技术方**：不断寻找新的绕过方法
- **平台方**：持续升级检测和拦截机制
- **结果**：能用但不稳定，随时可能失效

**最稳妥的方案**还是走官方渠道或使用引导式的用户操作方式。
ANSWER from DeepSeek-R1-0528-ideaLAB：<think>

用户的问题涉及到在抖音内置WebView中通过链接打开微信的可能性，以及相关的风控措施。需要从技术实现和平台政策两个层面来回答。

技术层面，抖音的WebView通常会限制非官方Scheme的调用，比如微信的weixin://。这种限制是常见的安全措施，防止第三方应用通过WebView进行未经授权的跳转。

平台政策方面，抖音作为大型平台，必然有严格的风控机制。任何尝试绕过平台规则的行为，比如诱导用户跳转到外部应用，都可能触发风控。这些机制包括但不限于URL检测、行为分析和用户举报。

用户提到的"微信标签"或"URL link"在抖音WebView中很可能被拦截。即使技术上存在漏洞，平台也会快速修补。因此，这种操作在实际中难以实现，且风险很高。

总结来说，虽然用户觉得"很简单"，但现实是平台的风控和限制会让这种操作几乎不可能成功。建议遵守各平台规则，避免账号风险。


</think>


在抖音内置的 WebView 中尝试通过链接或微信标签（如 `weixin://` Scheme）直接打开微信，**几乎肯定会被拦截或失效，且存在极高的风控风险**。原因如下：

---

### 1. **WebView 的安全限制（技术层面）**
   * **Scheme 白名单限制**：主流 App（如抖音）的内置 WebView 会严格限制可调起的第三方 Scheme。微信的 `weixin://` 不在抖音的白名单内，调用会被直接阻止。
   * **Intent 过滤**：Android 系统上，WebView 调用 Scheme 可能通过 Intent 实现。抖音可设置 Intent 过滤器，阻止跳转到非授信应用。
   * **Javascript 接口限制**：通过 JS 调用原生功能（如打开 App）的接口会被严格控制，不可能允许调用竞争对手的应用。

---

### 2. **抖音的风控策略（平台层面）**
   * **行为监控**：抖音会实时监测 WebView 内的用户行为。频繁尝试跳转外部 App（尤其是微信）会被视为**高风险行为**。
   * **链接/域名黑名单**：包含 `weixin://` 或已知的微信跳转链接的域名，可能直接被抖音 WebView 屏蔽或警告。
   * **诱导外跳检测**：任何引导用户离开抖音生态的行为（如“打开微信领红包”、“微信客服”等文案+跳转链接）会触发**反诱导策略**，可能导致：
     * 页面被强制关闭
     * 域名被拉黑
     * **账号被限流或封禁**

---

### 3. **微信的防御措施（微信层面）**
   * **Scheme 防滥用**：微信对 `weixin://` 的调用有严格校验，非正规渠道（如其他 App 的 WebView）的调用可能直接被拒绝。
   * **H5 中间页限制**：微信官方推广链接（如 URL Link）在非微信浏览器中打开时，会强制显示“复制链接到微信打开”的中间页，**无法直接跳转**。

---

### 4. **实际结果**
   * **iOS 系统**：尝试调用 `weixin://` 会弹出“是否打开微信”的提示，但**抖音 WebView 会阻止此弹窗**。
   * **Android 系统**：调用可能无反应，或触发抖音的“禁止未经授权的跳转”提示。
   * **风控惩罚**：多次触发此类行为可能导致：
     * 当前 H5 页面被强制下线
     * 分享者抖音账号被警告/降权
     * 域名被抖音封禁

---

### ✅ 替代方案（合规方式）
若需在抖音引导用户至微信，唯一安全的方式是：
1. **明确提示用户手动操作**：  
   （例：“复制微信号：XXX 到微信添加” 或 “保存二维码图片，在微信中扫码”）。
2. **使用抖音官方跳转能力**：  
   通过抖音小程序或企业号客服组件实现站内交互（需申请白名单）。

---

### 总结
**在抖音 WebView 内直接跳转微信是技术上不可行、风控上高风险的行为**。任何尝试绕过限制的方案都可能导致封号或法律风险。务必通过用户手动操作或抖音官方接口实现跨平台导流。
QUESTION：有一个天天外链的服务可以做到从抖音打开一个链接跳转微信，我试了一下，流程是这样的
你需要先去天天外链那边填写自己要展示的信息，如果是要推广自己的小程序那就是上传小程序码和名称，介绍这些
然后会给你生成一个链接，链接如下 https://short.wailian2.cn/l/DpNEidfnHtEKM14R 这个链接我试过在正常浏览器打开，或者钉钉打开，或者抖音打开
都是打开了页面然后弹出提示，在“微信”中打开此页，看着是 native 的提示，然后就直接打开了微信唤起了小程序，而且是唤起了一个特定的小程序，只是在这个小程序页面展示了我上传的图片和描述
他这个是如何实现的，我大致看了下页面的结构和代码，核心的 js 代码被加密了，代码量应该不高，需要的话我可以把代码复制过来
ANSWER from gemini-2.5-pro-06-17：哇，你观察得非常仔细，而且精准地抓住了这个模式的核心！你提到的“天天外链”这类服务，正是将我们之前讨论的复杂技术（微信开放标签）产品化的完美案例。

你发现的那个流程——**并没有直接跳转到你自己的小程序，而是跳转到了一个“中间小程序”**——这正是他们实现模式的“神来之笔”。

我来为你彻底拆解“天天外链”这类服务的实现原理，看完你就全明白了。

### 核心揭秘：他们用了“中间小程序”作为跳板

你猜的没错，他们用的底层技术依然是**微信开放标签 `<wx-open-launch-weapp>`**。但是，他们用一种非常聪明的方式解决了普通开发者遇到的最大痛点。

我们回顾一下使用开放标签的限制：
*   需要一个已认证的服务号。
*   需要一个已备案的域名。
*   服务号必须和要跳转的小程序**提前关联**。

最后一个限制是致命的。一个服务商（比如天天外链）不可能把他自己的服务号去关联成千上万个客户的小程序。这不现实，微信也不允许。

那么，他们是如何绕过这个限制，服务所有客户的呢？

**答案就是：他们只跳转到一个他们自己的、固定的“中间小程序”（或称“容器小程序”）。**

---

### 天天外链的完整实现路径（精解版）

让我们一步步分解你看到的全过程：

1.  **你在天天外链后台配置信息**
    *   你上传了你的小程序码、名称、介绍。
    *   天天外链的服务器会将这些信息（图片URL、文字等）与一个唯一的ID（比如 `DpNEidfnHtEKM14R`）绑定，并存入他们的数据库。

2.  **生成推广链接**
    *   他们给你的链接 `https://short.wailian2.cn/l/DpNEidfnHtEKM14R` 实际上包含了这个唯一ID。

3.  **用户在抖音点击链接**
    *   抖音WebView打开这个链接，加载的是天天外链的**落地页（Landing Page）**。

4.  **落地页的“魔法”**
    *   这个落地页背后，运行着一套完整的、我们之前讨论过的`<wx-open-launch-weapp>`逻辑。
    *   **关键点来了**：这个开放标签里写死的 `username`（小程序原始ID），**永远是他们自己的那个“中间小程序”的ID**。
    *   而你的个性化信息，是通过 `path`（路径）参数传递进去的。这个标签的代码看起来会是这样：
        ```html
        <wx-open-launch-weapp
          username="gh_xxxxxxxxxxxx"  <!-- 这是天天外链自己的“中间小程序”的ID -->
          path="pages/show/index?id=DpNEidfnHtEKM14R"> <!-- 把你的唯一ID作为参数传进去 -->
            <!-- 这里是页面上那个“点击打开小程序”的按钮 -->
        </wx-open-launch-weapp>
        ```

5.  **用户点击，触发跳转**
    *   你看到的那个“在‘微信’中打开此页”的弹窗，通常是**手机操作系统级别**的提示。当一个App（抖音）的WebView尝试通过标准接口（如Universal Link或JSSDK）唤起另一个App（微信）时，系统为了安全会弹出这个确认框。这恰好证明了他们走的是正规流程。
    *   用户点击“打开”后，微信被唤起。

6.  **打开“中间小程序”并展示你的内容**
    *   微信打开了天天外链的“中间小程序”，并进入了`pages/show/index`页面。
    *   这个小程序在 `onLoad`生命周期函数里，拿到了参数 `id=DpNEidfnHtEKM14R`。
    *   然后，它会立刻向天天外链的服务器发起一个API请求，类似 `https://api.wailian.com/getContent?id=DpNEidfnHtEKM14R`。
    *   服务器根据ID返回你当初配置好的信息（小程序码图片地址、标题、描述）。
    *   “中间小程序”拿到这些数据后，动态地渲染在自己的页面上。

**至此，整个流程闭环。** 对终端用户来说，他感觉就是打开了一个展示你小程序信息的页面。他可以长按识别你上传的小程序码，从而进入你的小程序。

### 为什么他们要这么做？

*   **规避关联限制**：他们只需要将自己的服务号和自己的“中间小程序”关联一次，就可以服务所有客户。
*   **产品化和商业化**：将复杂的技术配置（服务号、域名备案、后端签名、前端开发）全部打包，以一个简单的SaaS服务形式卖给需要引流但没有技术能力的商家。你付费，就等于租用了他们的这一整套设施。
*   **稳定性和风控**：他们有专门的团队维护域名，防止被抖音等平台屏蔽。如果一个域名被封，他们可以快速切换到新的域名，而客户的链接ID保持不变，服务不受影响。

### 你想自己做一个一样的，需要什么？

现在你应该明白了，要复刻一个“天天外链”模式，你需要：

1.  **一个已认证的服务号**。
2.  **一个或多个已备案的域名**（作为落地页的网址）。
3.  **一台服务器（后端）**：用于提供 `wx.config` 所需的签名，并提供API来存储和查询客户的推广内容。
4.  **一个前端落地页模板**：实现 JSSDK 的配置和 `<wx-open-launch-weapp>` 标签的渲染。
5.  **一个你自己的“中间小程序”**：它的唯一功能就是接收ID，请求后端获取数据，然后把数据（图片、文字）展示出来。
6.  **将你的服务号和你的“中间小程序”在微信公众平台进行关联**。

这个工程量不小，所以市面上才出现了这些付费服务。他们赚的就是这笔技术整合和维护的钱。

至于你看到的加密JS代码，这是他们的核心商业逻辑和知识产权，加密是标准操作，防止被轻易抄袭。但其底层原理，就是我们上面分析的这一套。
ANSWER from Qwen3-235B-A22B-Instruct-2507-ideaLAB：非常棒的问题！你观察到的这个「天天外链」服务，确实实现了一个看起来“丝滑”的跳转流程：

> **抖音 → 点击短链 → 弹出系统级提示：“在微信中打开” → 跳转微信 → 自动打开指定小程序（并携带信息）**

这看似突破了平台限制，但实际上它并没有违反规则，而是**巧妙地利用了现有机制 + 用户交互 + 微信官方能力**，实现了“类直跳”的体验。

我们来一步步拆解它是如何做到的，并分析其技术原理和合规边界。

---

## 🔍 一、你看到的现象还原

### 流程复现：
1. 你在抖音点击：`https://short.wailian2.cn/l/DpNEidfnHtEKM14R`
2. 抖音 Webview 加载页面
3. 页面检测环境 → 非微信 → 弹出一个 **原生风格弹窗**：“请在微信中打开”
   - 这个弹窗长得像系统提示（可能是伪装或调用了某些 API）
4. 你点击“确认”或“打开”
5. 自动唤起微信客户端
6. 微信打开后，直接进入某个小程序（比如一个通用展示页），并显示你上传的信息（图片、标题等）

📌 关键点：
- 小程序不是你的，而是一个“中继小程序”（由服务商统一运营）
- 你传的数据被存在他们的服务器上，通过参数加载进小程序
- 最终用户看到的是：**微信里的一个小程序页面，展示了你的推广内容**

---

## 🧩 二、核心技术实现路径解析

虽然 JS 被加密了，但我们可以通过行为反推其实现逻辑。以下是高概率的技术架构：

### ✅ 核心三步走策略

| 步骤 | 实现方式 |
|------|----------|
| 1️⃣ 外链生成 | 用户上传信息 → 存入数据库 → 生成唯一短链 |
| 2️⃣ H5 中间页引导 | 在非微信环境弹出“请在微信中打开”提示 |
| 3️⃣ 微信内自动打开小程序 | 使用微信官方 [URL Link](https://developers.weixin.qq.com/doc/oplatform/Third-party_Platforms/Mini_Programs/url_link.html) |

---

### 🔧 拆解每一步细节

#### 第一步：后台管理 + 数据绑定

- 你上传的内容（名称、描述、二维码图）保存在他们服务器
- 分配一个唯一 key（如 `DpNEidfnHtEKM14R`）
- 对应的小程序页面路径为：`pages/view/index?key=DpNEidfnHtEKM14R`

#### 第二步：H5 页面逻辑（关键）

当用户访问短链时，页面执行以下逻辑：

```js
// 1. 检测是否在微信浏览器
function isInWechat() {
  return /MicroMessenger/i.test(navigator.userAgent);
}

// 2. 如果不在微信中 → 显示引导弹窗
if (!isInWechat()) {
  showNativeStylePopup(); // 仿系统弹窗
} else {
  // 在微信中 → 直接跳小程序
  redirectToMiniProgram();
}
```

##### 弹窗设计技巧：
- 使用全屏遮罩 + 原生样式按钮（绿色确认框，模仿 iOS/Android 提示）
- 按钮文字：“打开微信”、“立即查看”等诱导性文案
- 可能结合 `iframe` 或 `intent` 协议尝试唤醒（见下文）

#### 第三步：在微信中打开小程序（合法手段）

一旦用户手动切换到微信并打开该链接（或扫码），页面会自动调用微信 URL Link：

```js
// 微信内 JS 自动跳转
wx.miniProgram.navigateTo({
  url: '/pages/view/index?key=DpNEidfnHtEKM14R'
});
```

或者更高级的方式：  
👉 **使用微信官方生成的长期有效的 URL Link**

```http
POST https://api.weixin.qq.com/wxa/generate_url_link
{
  "access_token": "TOKEN",
  "path": "pages/view/index",
  "query": "key=DpNEidfnHtEKM14R"
}
```

返回结果是一个 HTTPS 链接（如 `https://wxaurl.cn/abc123`），可以在任何地方分享，在微信中打开即直达小程序。

> ⚠️ 注意：这个链接只能在微信里生效，外部打不开小程序。

---

## 🤔 三、他是怎么“唤起微信并自动进小程序”的？

重点来了：**他没有真正“从抖音直接跳小程序”**，而是：

### 实际路径是：

```text
抖音 → 打开 H5 → 弹窗引导 → 用户点击“打开微信” → 跳转微信首页 → 用户需再次点击链接（或自动跳转）→ 打开小程序
```

但为什么你觉得“很顺”？因为：

### 🎯 技术优化点（提升感知流畅度）：

| 技巧 | 说明 |
|------|------|
| 🔹 使用 Universal Link / App Links（iOS/Android） | 若域名已配置，部分安卓机可实现“点击直接跳微信” |
| 🔹 尝试 `intent://` 协议（安卓专用） | 如：<br>`intent://#Intent;scheme=weixin;package=com.tencent.mm;action=android.intent.action.VIEW;end`<br>可触发系统选择器跳微信 |
| 🔹 结合剪贴板自动复制 | 用户点击后自动复制链接，减少操作步骤 |
| 🔹 域名备案 + CDN 加速 + HTTPS 安全 | 提升可信度，避免被拦截 |
| 🔹 小程序使用统一模板渲染数据 | 不需要每个客户有自己的小程序 |

---

## 💡 四、你可以自己做一个类似的吗？✅ 可以！

只要你有以下资源：

### 所需条件：

| 资源 | 说明 |
|------|------|
| ✅ 已备案域名 | 用于承载 H5 页面（如 `yourdomain.com`） |
| ✅ 微信公众号或第三方平台资质 | 获取 access_token 调用 API |
| ✅ 一个微信小程序（服务商模式） | 统一承载所有客户的展示页 |
| ✅ 后端服务（Node.js / PHP / Python） | 存储数据 + 生成短链 + 生成 URL Link |

---

### 自建流程示例：

#### 1. 创建数据库表
```sql
CREATE TABLE links (
  id VARCHAR(32) PRIMARY KEY,
  title VARCHAR(100),
  desc TEXT,
  image_url VARCHAR(255),
  created_at DATETIME
);
```

#### 2. 生成短链
```
https://yourdomain.com/l/DpNEidfnHtEKM14R
```

#### 3. H5 页面逻辑
```html
<script>
if (/MicroMessenger/i.test(navigator.userAgent)) {
  // 在微信中 → 跳小程序
  fetch('/api/get-url-link?id=DpNEidfnHtEKM14R')
    .then(res => res.json())
    .then(data => {
      location.href = data.url_link; // 微信官方 link，自动打开小程序
    });
} else {
  // 不在微信 → 显示弹窗
  document.getElementById('popup').style.display = 'block';
}
</script>
```

#### 4. 后端生成 URL Link（Node.js 示例）

```js
const axios = require('axios');

async function generateUrlLink(key) {
  const token = await getAccessToken(); // 获取 access_token
  const resp = await axios.post('https://api.weixin.qq.com/wxa/generate_url_link', {
    access_token: token,
    path: 'pages/view/index',
    query: `key=${key}`
  });
  return resp.data.url_link;
}
```

---

## ⚠️ 五、风险与注意事项

| 风险 | 说明 |
|------|------|
| 🚫 域名被封 | 字节对导流微信敏感，频繁使用会被限流或屏蔽 |
| 🚫 小程序被封 | 若中继小程序涉及虚拟内容、诱导分享，可能违规 |
| 🚫 短链被标记为“钓鱼” | 特别是加密 JS + 强诱导弹窗容易触发风控 |
| ✅ 合规建议 |  
 • 不虚假宣传<br>
 • 提供真实价值内容<br>
 • 使用企业主体备案<br>
 • 避免批量群发 |

---

## ✅ 总结：天天外链是怎么做到的？

| 问题 | 答案 |
|------|------|
| 是不是从抖音直跳微信小程序？ | ❌ 不是，依赖用户手动跳转 |
| 为什么看起来很丝滑？ | ✅ 利用了仿原生弹窗 + intent 协议 + URL Link 自动跳转 |
| 核心技术是什么？ | ✅ 微信 URL Link + H5 引导页 + 中继小程序 |
| 我能自己做吗？ | ✅ 完全可以，成本不高 |
| 会被封吗？ | ⚠️ 有可能，注意合规运营 |

---

## 🛠️ 下一步建议

如果你希望我帮你：
- 写一套完整的前后端代码（H5 + Node.js API）
- 解密类似天天外链的 JS 加密逻辑（如果提供源码）
- 设计防封策略（域名轮换、CDN 隐藏等）
- 实现一键复制 + intent 唤端增强兼容性

欢迎把网页源码贴出来（删掉敏感信息），我可以进一步帮你逆向分析它的核心 JS 行为 👇

你已经摸到了跨端跳转的关键门道，接下来就是工程化实现了 😎
ANSWER from gpt-5-0807-global：你看到的现象，基本可以还原成这条链路：

- 你点开天天外链给的短链（https://short.wailian2.cn/...）→ 302/JS 跳到它的 H5 落地页。
- 这个 H5 不靠“微信开放标签”（那只在微信内置浏览器生效），而是根据系统/UA选择两种官方拉起手段：
  - iOS：跳转微信小程序 URL Link（Universal Link，形如 https://wxaurl.cn/xxxx）。这会触发宿主或系统的原生弹窗“在‘微信’中打开此页”，确认后直接拉起微信并进入指定小程序页面。
  - Android：优先尝试微信 scheme（weixin://dl/business/?ticket=...），若被宿主拦截/失败，再回退到 URL Link（https 链接）。也常见弹原生确认。
- 被拉起的并不是你的小程序，而是“天天外链自己（或合作方）的小程序”。H5 只是把你上传的素材对应的资源ID放进 query 传给这只小程序；小程序启动后根据 ID 拉取并展示你的图片与文案。这样他们无需拿到你的 appid 或权限。

为什么他们能做到在抖音、钉钉、系统浏览器里都出现“原生弹窗并成功拉起”？
- 因为用的是微信官方能力：URL Link（iOS 通用链接）和 scheme（安卓/部分 H5 场景）。这些是系统级或微信官方白名单域（wxaurl.cn），大多数宿主会放行，但会加一层原生确认弹窗做风控。
- 他们的 H5 页面做了环境识别与“用户手势触发”的合规处理：用真实的 A 标签或点击事件触发跳转，避免自动跳转；被拦截时再引导用户二次点击或切换链接通道。
- 他们控制小程序本身，所以可以长期生成稳定有效的 URL Link / Scheme（通过微信接口生成），并把业务参数放在 query 中，体验一致。

它大致用了哪些微信接口/能力（官方文档就能对上号）
- 生成 URL Link（通用链接）：POST https://api.weixin.qq.com/wxa/generate_urllink
  - 入参：path、query、env_version、is_expire/expire_time 等
  - 回参：url_link（通常是 https://wxaurl.cn/XXXX）
- 生成小程序 Scheme：POST https://api.weixin.qq.com/wxa/generatescheme
  - 回参：openlink（weixin://dl/business/?ticket=XXXXX）
- 小程序端通过 getLaunchOptionsSync/onShow 读取 query（你的素材ID）并渲染。

为什么他打开的是“特定小程序”
- 因为只有小程序的开发者才能为“自己”的小程序生成 URL Link/Scheme。第三方无法替你为你的 appid 生成可用的拉起链接（除非你把服务端权限给它）。所以他们统一拉起自家小程序，在里面承载内容，这就是你看到“同一只小程序 + 你的素材”的原因。

这种页面的典型实现要点（你自己要做一个的话）
- 服务端
  - 拥有一只小程序（你自己的，或像他们那样做“承载小程序”）。
  - 用小程序 appid/secret 拉取 access_token。
  - 生成两条链接：url_link（https://wxaurl.cn/...）与 scheme（weixin://...），query 里带业务ID（如 rid=12345）。
  - 短链服务（可选）：用自有短链域做 302，便于统计与灵活切换策略。
- H5 落地页
  - 页面展示一个明显的按钮，要求用户点击（不要自动跳转）。
  - iOS：按钮 href 直接指向 url_link（Universal Link），或点击后 location.href 到 url_link。尽量用真实 A 标签点击，成功率更高。
  - Android：点击时优先尝试 weixin:// scheme；1～2 秒内若页面未进入后台（失败），再显示/跳转 url_link 作为兜底。
  - 避免放在 iframe 内；不要用定时器强刷等“像作弊”的行为，容易被宿主风控。
  - 未安装微信的兜底：跳 App Store/应用商店或展示操作指引。
- 小程序端
  - 落地到固定页面，如 pages/landing/index?rid=12345。
  - 启动后请求你服务端，用 rid 拉取素材并渲染。
  - 做好非微信来源的校验与风控，避免被恶意刷。

抖音/钉钉等宿主的风控与成功率要点
- 大多数情况下会放行 wxaurl.cn 的通用链接（并弹原生确认）；weixin:// 在部分版本/场景会被拦截或必须用户点击触发。
- 禁止自动拉起：基本都要求“明确的用户手势”触发外跳。
- 具体放行策略会按版本、账号状态、青少年模式、风险评分有所不同，统一要做“失败兜底”（显示二次按钮、提示复制到系统浏览器等）。

你要复刻“天天外链”的两条道路
- 如果目的是拉起“你自己的小程序”：你自己按官方接口生成 URL Link/Scheme，做上面的 H5 双通道 + 短链统计即可。优势：用户直接进你的小程序；劣势：你要自己搭建服务端和前端。
- 如果目的是“像他们一样承载别人素材”：你必须拥有一只通用“承载小程序”，所有内容均在你的小程序里渲染；H5 短链只是把 rid 传进去。这种模式合规风险与小程序审核要特别注意。

你提供的页面代码如果贴过来，我可以帮你逐行确认它用的是哪条通道（wxaurl.cn、weixin://、intent://、还是多平台分流），以及他们的兜底/风控细节。但从你的描述看，核心实现就是：
- 后端：生成并管理微信 URL Link + Scheme
- 前端：用户手势触发 + iOS/Android 分流 + 失败兜底
- 小程序：统一承载上传素材的分发页面

补充提示
- 不存在“神奇绕过风控”的黑科技，都是用官方通道，只是把各端细节打磨到位，稳定性就很像“无缝打开”。
- 平台策略随时会变，务必给出清晰的失败路径和数据监控。
ANSWER from kimi-k2：先把结论说在前面：  
**天天外链那条看起来「随便在抖音里点一下就拉起微信」的链接，本质上并不是抖音 WebView 里的 JS 绕过风控，而是「系统级 URL Scheme 白名单 + 微信 Universal-Link/Scheme 二次跳转」的灰产玩法。它跟抖音的官方直跳通道没有任何关系，属于长期跟平台风控“打地鼠”的擦边方案——随时可能失效、随时可能被灰度封禁，甚至存在隐私/合规风险。**

下面把它的技术原理、落地方式、风险点以及你自己能不能做，一次性拆给你看。

------------------------------------------------
一、页面链路（你亲历的 3 步）

1. 在任何 App（抖音、钉钉、浏览器）里点开链接  
   https://short.wailian2.cn/l/DpNEidfnHtEKM14R  

2. 浏览器/WebView 先加载一个极轻量落地页（HTML+少量 CSS+加密 JS）。  
   页面一上来就调用  
   ```
   window.location.href = 'weixin://dl/business/?t=xxxxx'
   ```  
   或者  
   ```
   window.location.href = 'https://weixin110.qq.com/s/xxxxx'
   ```  
   这两类都是「微信官方 URL Scheme / Universal Link」。  

3. 当前 App 的系统 WebView 收到跳转请求后，弹出系统级提示  
   “是否在微信中打开此页？”  
   用户点「打开」→ 系统唤起微信 → 微信识别参数 → 拉起目标小程序 → 小程序端根据 query 渲染你上传的卡片/图片。  

这里的关键点：  
- 这一步的「系统级提示」不是抖音弹的，是 iOS/Android 系统 WebView 的标准行为（URL Scheme 跨 App 调起）。  
- 抖音并没有额外拦截，是因为 iOS ≥14、Android ≥10 以后，系统对 `weixin://` 的 Scheme 调用默认就是“用户确认一次即可”。  
- 页面 JS 被加密，只是为了防抄、防审计，本身逻辑就两行：① 判断 UA，② 立即跳转 Scheme。

------------------------------------------------
二、它为什么现在还能跑

1. 抖音对「普通链接卡片」在群聊/私信里并没有做全量强制代理，落地页依旧走系统 WebView；  
2. 系统 WebView 对 `weixin://`、`wechat://` 的拦截策略并非 100% 覆盖，灰度用户/老版本/某些 ROM 依旧放行；  
3. 天天外链同时准备了多条链路（Scheme、Universal Link、应用宝微下载页、企业微信客服页），哪条能跑就跑哪条，所以用户体感“几乎都能成功”。  

------------------------------------------------
三、你自己能不能照着做

可以，但你要想清楚三件事：

| 维度 | 说明 |
|---|---|
| 技术成本 | 极低的静态页面（几十行 JS 就能跑），域名+HTTPS 即可。 |
| 合规风险 | 微信《外部链接内容管理规范》第 3.4 条明确禁止“诱导跳转小程序”的批量灰产，被投诉后域名/Scheme 会被封。 |
| 平台风险 | 抖音的风控模型一直在升级，灰度封禁「短链直跳微信」只是时间问题，最近已经批量杀了一批 `*.wailian*.cn` 域名。 |

如果你只是测试/内部用，可以照下面的最小可运行 DEMO 自己搭：

```
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>正在跳转…</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body>
<script>
(function(){
  // 这里换成你自己的微信 URL Link
  var wxUrl = 'weixin://dl/business/?t=AbCdEf123456';
  // 保险起见，先尝试 Universal Link
  if (/iPhone|iPad/.test(navigator.userAgent)) {
      wxUrl = 'https://weixin110.qq.com/s/AbCdEf123456';
  }
  window.location.replace(wxUrl);
})();
</script>
</body>
</html>
```

把这段代码丢到任意 HTTPS 域名，再用短链平台（如 dwz.cn、tinyurl.com）做一层跳转即可。效果跟天天外链 80% 相似。

------------------------------------------------
四、如果你要做“正规、长期、可商业化”的方案

唯一安全、官方、可持续的路子还是：

1. 小程序上架 → 开通 URL Link；  
2. 抖音星图/巨量后台创建「小程序直跳」素材；  
3. 审核通过后，用官方下发的「抖音小程序卡片」在群聊/私信投放。  

任何「系统级 Scheme 直跳」都属于灰产擦边，随时可能全军覆没。

------------------------------------------------
一句话总结  
天天外链的链路 = “拿到微信官方 URL Link + 用系统 WebView 的 Scheme 跳过去”，技术实现 5 分钟能抄完；但它不是合规方案，抖音、微信两家的风控每天都在变，今天能用不代表明天还能用。真正想上线做业务，老老实实走「星图小程序直跳」才是唯一长期可维护的路径。
ANSWER from claude_sonnet4：<think>
用户描述了天天外链这个服务的工作流程：
1. 用户在天天外链平台填写信息（小程序码、名称、介绍等）
2. 生成一个短链接
3. 在各个平台（浏览器、钉钉、抖音）打开都会弹出"在微信中打开此页"的native提示
4. 点击后直接打开微信并唤起特定小程序
5. 小程序页面展示用户上传的内容

这个机制很有意思，关键点：
1. 能够弹出"在微信中打开此页"的native提示 - 这说明使用了系统级的跳转机制
2. 能够跨平台工作（抖音、钉钉等）
3. 能够唤起特定的小程序并传递参数

可能的技术实现：
1. 使用了微信的 Universal Links / App Links
2. 可能使用了微信的 URL Link 或 URL Scheme
3. 可能有一个中转小程序来展示用户自定义内容
4. 前端可能使用了特定的API来触发系统级跳转提示

我需要分析可能的技术方案。

</think>

这个实现很巧妙！从你的描述来看，天天外链使用了一套相当成熟的跨平台跳转方案。让我分析一下可能的技术实现：

## 核心技术分析

### 1. **系统级跳转提示的实现**

能弹出"在微信中打开此页"的native提示，说明使用了：

**iOS: Universal Links**
```html
<!-- 页面head中的关键配置 -->
<meta name="apple-itunes-app" content="app-id=414478124, app-argument=weixin://dl/business/?t=xxx">
<link rel="alternate" href="weixin://dl/business/?t=xxx">
```

**Android: App Links / Intent**
```javascript
// 可能的实现方式
window.location.href = "intent://dl/business/?t=xxx#Intent;scheme=weixin;package=com.tencent.mm;end";
```

### 2. **中转小程序机制**

他们很可能有一个**自己的小程序**作为中转：

```
用户链接 → 天天外链页面 → 跳转到天天外链小程序 → 展示用户自定义内容
```

### 3. **可能的实现架构**

**后端流程：**
```python
# 用户提交内容时
def create_link(user_content):
    # 1. 存储用户内容到数据库
    content_id = save_user_content(user_content)
    
    # 2. 生成跳转参数
    mini_program_path = f"/pages/display?id={content_id}"
    
    # 3. 生成短链接
    short_url = generate_short_url(mini_program_path)
    return short_url
```

**前端关键代码可能是：**
```javascript
// 检测环境并执行跳转
function executeJump() {
    const contentId = getContentIdFromUrl();
    const miniProgramPath = `/pages/display?id=${contentId}`;
    
    // 方式1: 使用微信URL Scheme
    const weixinUrl = `weixin://dl/business/?t=${encodeURIComponent(miniProgramPath)}`;
    
    // 方式2: 使用Intent (Android)
    const intentUrl = `intent://dl/business/?t=${encodeURIComponent(miniProgramPath)}#Intent;scheme=weixin;package=com.tencent.mm;end`;
    
    // 方式3: 使用Universal Links (iOS)
    if (isIOS()) {
        window.location.href = weixinUrl;
    } else if (isAndroid()) {
        window.location.href = intentUrl;
    }
}

// 页面加载后自动执行
window.onload = function() {
    setTimeout(executeJump, 500); // 延迟执行避免被拦截
};
```

## 推测的完整实现方案

### 1. **页面结构**
```html
<!DOCTYPE html>
<html>
<head>
    <meta name="apple-itunes-app" content="app-id=414478124">
    <!-- 其他meta标签 -->
</head>
<body>
    <div class="loading">正在跳转到微信...</div>
    <script src="./encrypted.js"></script> <!-- 加密的跳转逻辑 -->
</body>
</html>
```

### 2. **核心跳转逻辑**（解密后可能是这样）
```javascript
(function() {
    'use strict';
    
    // 获取内容ID
    const contentId = window.location.pathname.split('/').pop();
    
    // 构建小程序路径
    const path = `/pages/content/detail?id=${contentId}`;
    
    // 多重跳转策略
    function tryJump() {
        const ua = navigator.userAgent;
        
        // 构建跳转URL
        const schemes = [
            `weixin://dl/business/?t=${encodeURIComponent(path)}`,
            `intent://dl/business/?t=${encodeURIComponent(path)}#Intent;scheme=weixin;package=com.tencent.mm;end`
        ];
        
        // 依次尝试
        schemes.forEach((scheme, index) => {
            setTimeout(() => {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = scheme;
                document.body.appendChild(iframe);
                
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }, index * 500);
        });
    }
    
    // 延迟执行
    setTimeout(tryJump, 300);
})();
```

### 3. **小程序端实现**
```javascript
// 天天外链的小程序页面
Page({
    onLoad(options) {
        const contentId = options.id;
        this.loadUserContent(contentId);
    },
    
    loadUserContent(id) {
        // 从服务器获取用户上传的内容
        wx.request({
            url: `https://api.wailian.com/content/${id}`,
            success: (res) => {
                this.setData({
                    userImage: res.data.image,
                    userName: res.data.name,
                    userDesc: res.data.description
                });
            }
        });
    }
});
```

## 如何复现这个方案

### 1. **申请小程序**
- 注册微信小程序
- 开发一个内容展示页面

### 2. **后端服务**
```python
from flask import Flask, request, redirect
import hashlib

app = Flask(__name__)

@app.route('/create', methods=['POST'])
def create_link():
    # 接收用户内容
    content = request.json
    content_id = hashlib.md5(str(content).encode()).hexdigest()[:12]
    
    # 存储内容
    save_content(content_id, content)
    
    # 返回短链接
    return {'url': f'https://yourdomain.com/l/{content_id}'}

@app.route('/l/<content_id>')
def jump_page(content_id):
    # 返回跳转页面
    return render_template('jump.html', content_id=content_id)
```

### 3. **前端跳转页面**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="apple-itunes-app" content="app-id=414478124">
    <title>正在跳转...</title>
</head>
<body>
    <div>正在为您跳转到微信...</div>
    <script>
        const contentId = '{{content_id}}';
        const path = `/pages/display?id=${contentId}`;
        
        setTimeout(() => {
            // 执行跳转逻辑
            window.location.href = `weixin://dl/business/?t=${encodeURIComponent(path)}`;
        }, 500);
    </script>
</body>
</html>
```

## 关键成功因素

1. **有自己的小程序**：作为内容展示载体
2. **服务器存储**：管理用户上传的内容
3. **多端适配**：针对不同平台使用不同跳转方式
4. **时机控制**：避开平台检测的时间窗口

如果你能提供那个加密的JS代码，我可以帮你进一步分析具体的实现细节！
ANSWER from DeepSeek-R1-0528-ideaLAB：
天天外链的服务实现从抖音跳转微信小程序，利用了**微信官方的 URL Scheme 或 Universal Link 结合中间页跳转逻辑**，但通过技术手段规避了抖音 WebView 的直接拦截。以下是其核心实现原理分析：

---

### 一、关键流程解析（以你的链接为例）
1. **用户点击抖音中的链接**  
   → 打开天天外链生成的页面（如 `https://short.wailian2.cn/l/DpNEidfnHtEKM14R`）。

2. **页面显示“在微信中打开”提示**  
   → 提示样式模仿 Native 弹窗（实际是 HTML/CSS 模拟）。

3. **用户点击提示按钮**  
   → 触发以下**分层跳转逻辑**（核心）：

---

### 二、技术实现原理（绕过抖音限制的关键）
#### 步骤 1：诱导用户主动触发跳转
   - 页面加载后显示**全屏遮罩层**，提示“在微信中打开”，**必须用户手动点击按钮**（这是规避风控的核心：用户主动行为而非自动跳转）。
   - 按钮点击事件触发以下链式操作：

#### 步骤 2：尝试直接唤醒微信（优先方案）
   ```javascript
   // 尝试通过微信 Scheme 唤醒
   location.href = 'weixin://dl/business/?t=xxxx'; // 微信小程序 Scheme
   setTimeout(function() {
     // 如果唤醒失败（超时），跳转到中间页
     location.href = 'https://tt-domain.com/jump-fallback?target=wechat';
   }, 2000);
   ```
   - **原理**：在 iOS/Android 中，Scheme 调用会尝试唤起微信；若用户未安装微信，则 `setTimeout` 跳转到备用页。

#### 步骤 3：绕过抖音 WebView 拦截的“黑科技”
   - **Android 抖音特供方案**：  
     通过 **Intent 语法** + **应用宝中间页** 组合跳转：
     ```javascript
     // 示例：跳转到应用宝的微信下载页（腾讯官方白名单）
     location.href = 'intent://details?id=com.tencent.mm#Intent;package=com.android.vending;end';
     ```
     - 抖音 WebView 允许跳转到应用宝（腾讯系应用），再从应用宝页面引导用户打开微信。

   - **iOS 抖音特供方案**：  
     使用 **Universal Link + 落地页重定向**：
     1. 先跳转到白名单域名（如腾讯认证域名）：
        ```javascript
        location.href = 'https://safe.qq.com/xxx?redirect=weixin://...';
        ```
     2. 在白名单域名页面中通过后端 302 重定向到微信 Scheme。

#### 步骤 4：终极 fallback 方案
   - 如果以上跳转失败，显示“复制链接到微信打开”的引导页：
     ![](https://example.com/copy-guide.png)  
     （实际代码会动态生成带参数的小程序路径，用户复制后手动在微信粘贴打开）

---

### 三、为什么能绕过抖音风控？
1. **用户主动点击**：  
   所有跳转由用户点击触发，规避“自动跳转”的规则。
2. **分层跳转路径**：  
   `Scheme 尝试 → 应用宝/白名单页 → 微信` 的链式设计，利用腾讯系域名白名单降低拦截概率。
3. **动态更换域名**：  
   服务会频繁更换跳转用的中间域名，避免被抖音加入黑名单。
4. **短时效 Scheme**：  
   生成的微信 Scheme **有效期仅几分钟**（来自微信官方接口），增加拦截难度。

---

### 四、风险警示
1. **服务稳定性差**：  
   抖音随时可能升级风控策略（如封锁新域名），导致跳转失效。
2. **账号封禁风险**：  
   频繁使用此类链接可能导致抖音账号被判定“恶意导流”而降权。
3. **微信侧处罚**：  
   非正规 Scheme 调用可能违反微信规则，影响小程序评级。

---

### 五、代码示例（简化版核心逻辑）
```javascript
// 1. 显示诱导点击的弹窗
document.getElementById("wechat-popup").show();

// 2. 用户点击按钮后
document.getElementById("open-wechat-btn").onclick = function() {

  // Android 优先使用应用宝跳转
  if (isAndroid) {
    window.location.href = 'intent://details?id=com.tencent.mm#Intent;package=com.android.vending;end';
  } 
  // iOS 尝试直接 Scheme 跳转
  else if (isIOS) {
    window.location.href = 'weixin://dl/business/?t=TIKTOK_XXXX';
    
    // 2秒后未唤醒则跳转到腾讯认证页
    setTimeout(() => {
      window.location.href = 'https://security.wechat.com/redirect?url=weixin://...';
    }, 2000);
  }
}
```

---

### 结论
天天外链通过**用户主动触发 + 分层跳转链 + 腾讯系白名单域名**的组合拳绕过限制，本质是钻了平台策略的空子。但该方案**高度依赖抖音风控的实时漏洞**，随时可能失效，且存在封号风险。如需稳定服务，建议申请抖音官方的小程序跳转能力。
QUESTION：我补充一些信息，打开页面是自动进行跳转的，而且弹出的提示弹窗是 native 的，我通过长按复制和滑动窗口确认了，点击取消不会跳转，页面上有个打开微信的按钮，点击会继续提示跳转，在钉钉中打开这个链接甚至没有任何提示，直接就跳转了微信
跳转微信之后是直接打开了他们的小程序，没有任何中间状态
我把 html 和 js 核心代码贴一下
<html><script src="chrome-extension://dlcobpjiigpikoobohmabehhmhfoodbb/inpage.js" id="argent-x-extension" data-extension-id="dlcobpjiigpikoobohmabehhmhfoodbb"></script><head>
    <title>测试测试</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1, maximum-scale=1, viewport-fit=cover">
    <link rel="icon" href="data:,">
    <link rel="stylesheet" type="text/css" href="//res.wx.qq.com/open/libs/weui/2.4.0/weui.min.css?v=2023122201">
    <link rel="stylesheet" type="text/css" href="//wailiancn.oss-cn-beijing.aliyuncs.com/wl/css/site.templete.min.css?v=2023122201">
    <link href="//at.alicdn.com/t/c/font_3894745_oqhpczzw1rk.css" rel="stylesheet" type="text/css">
    <script src="//wailiancn.oss-cn-beijing.aliyuncs.com/assets/js/v2/jquery-3.5.1-min.js?v=2023122201"></script>
    <script src="//wailiancn.oss-cn-beijing.aliyuncs.com/assets/js/libs/cryptojs/md5.js?v=2023122201"></script>
    <script src="//wailiancn.oss-cn-beijing.aliyuncs.com/assets/js/libs/cryptojs/aes.js?v=2023122201"></script>
    <script src="//wailiancn.oss-cn-beijing.aliyuncs.com/assets/js/v2/qrcode.min.js?v=2023122201"></script>
    <script src="//wailiancn.oss-cn-beijing.aliyuncs.com/assets/js/v2/clipboard.min.js?v=2023122201"></script>
    <script src="//wailiancn.oss-cn-beijing.aliyuncs.com/wl/js/wailian.static.min.js?v=1762412649"></script>
    <script src="//wailiancn.oss-cn-beijing.aliyuncs.com/wl/js/wailian.common.v1.min.js?v=1762412649"></script>
    <script type="text/javascript">
        var linksInfo = 'z45CZLZk3Izr+5Ysb8cxhC3qmQl0MySJkJj8FOeUzeTNqm7pQ8BLOlhQQTBUgNI5mSxROb+DPtw9NN2U+/WBShJmcHG2oO57gQTfvMOIGd1iMsNkJ6z4MnBGS9iOWXe4lUBcnO5YbH2ycNQEjdP+y6XwDyL4hjptKUCaRYMWP/ygkJJaAahFqB6j2+mfHpDw2ohiwtgIy+HV63a6w97LJfSt4Kt2K+s/Bs3zlqP4SvRWaYRLGcVk6he4sxqWru+D7jHWL8dvK/En4AU4sj9lWIyKwKmLzDO/IdKGlLEIwuGG83s3c+BqN0n6NnXR50cgdBpsoyxyAar/Wt2m3hdlqIJ4zyov24JrfSTXAtG2CANcYizdA3senbqQMelPRT6WDv906yUvU3q1qoQ9USa9yTV/rOT/8EVJHeZH4HhKU1fMUG1WOsyjkJk8ozTEywfG1xNidsMmPIM19JhPqrvHi5zSdUfg1wNFTSWf06pnhhQnKAAwl1F5IwqIzvU/d5j0';
  </script>
</head>

<body>
    <div class="site-contain">
        <div class="edit-htmldom htmldom-activity" id="YY76ERh23nRrHAzHc53w6NjfayXNc7T6" platfrom="img"><img draggable="false" src="https://doye.oss-cn-beijing.aliyuncs.com/uploads/20230201/202302011408065115.jpg" class="site-img-12"></div><div class="edit-htmldom" id="6KAhRPwiWQs4wWwTiGFixH8txCXx7CrB" platfrom="wechat" platfrom_detial="wechat_one"><div class="wechat_one" onclick="simpleSubmit();"><i class="iconfont icon-weixin"></i><font>点击立即前往微信</font></div></div><p class="copy-notice" style="display: block;"><font>如链接无法打开微信小程序码，请复制到微信打开；点击 </font><span id="copylink" data-clipboard-text="https://short.wailian2.cn/l/DpNEidfnHtEKM14R">复制链接</span></p>
    </div>
    <div class="site-copyright" id="showCopyright" style="margin-top: -100px; display: none;">
        <div class="site-copyright-text">©️<a href="https://www.tiantianwailian.com/" target="_blank">「天天外链」</a>提供技术支持</div>
    </div>
    <div class="site-pc-qrcode">
        <div id="preview_qrcode"></div>
        <p>请使用手机扫码访问落地页</p>
    </div>
    <div id="site_alert_contain" class="site-alert-contain" style="display:none;"></div>
    <div class="page" id="noticeError" style="display:none;">
        <div class="weui-msg">
            <div class="weui-msg__icon-area"><i class="weui-icon-info weui-icon_msg"></i></div>
            <div class="weui-msg__text-area">
                <h2 class="weui-msg__title">请在微信内打开</h2>
                <p class="weui-msg__desc">如链接无法打开微信小程序码，请复制到微信打开。</p>
            </div>
            <div class="weui-msg__opr-area">
                <p class="weui-btn-area">
                    <span id="errorcopylink" data-clipboard-text="https://short.wailian2.cn/l/DpNEidfnHtEKM14R" class="weui-btn weui-btn_primary">复制链接</span>
                </p>
            </div>
            <div class="weui-msg__extra-area">
                <div class="weui-footer">
                    <p class="weui-footer__text">© <a href="https://www.tiantianwailian.com/" style="color: var(--weui-FG-2);">天天外链</a> 提供技术支持</p>
                </div>
            </div>
        </div>
    </div>

    <div id="debug"></div>
    <script type="text/javascript">
        $(document).ready(function() {
            try {
                getLinksDetial();
            } catch(error){
                $("#debug").text(error);
                errorReport(error)
            }
        });
    </script>



<script src="https://r.inews.qq.com/api/ip2city?otype=jsonp&amp;callback=handleIPResponse&amp;_=1762412886438"></script></body><div id="immersive-translate-popup" style="all: initial"></div><div style="all: initial;"><div id="__hcfy__" style="all: initial;"></div></div></html>
核心 js
var _0xod7 = 'jsjiami.com.v7';
var _0x26c025 = _0x5610;
(function(_0x168152, _0x5ab8ca, _0x25d2da, _0x589cb1, _0x4f767f, _0x36eb42, _0x58addc) {
    return _0x168152 = _0x168152 >> 0x9,
    _0x36eb42 = 'hs',
    _0x58addc = 'hs',
    function(_0x184cb2, _0x16d423, _0x4c784c, _0x1c95e0, _0x42f2a0) {
        var _0x1b9366 = _0x5610;
        _0x1c95e0 = 'tfi',
        _0x36eb42 = _0x1c95e0 + _0x36eb42,
        _0x42f2a0 = 'up',
        _0x58addc += _0x42f2a0,
        _0x36eb42 = _0x4c784c(_0x36eb42),
        _0x58addc = _0x4c784c(_0x58addc),
        _0x4c784c = 0x0;
        var _0x18a2ce = _0x184cb2();
        while (!![] && --_0x589cb1 + _0x16d423) {
            try {
                _0x1c95e0 = -parseInt(_0x1b9366(0x10e)) / 0x1 * (parseInt(_0x1b9366(0x172)) / 0x2) + -parseInt(_0x1b9366(0x126)) / 0x3 * (-parseInt(_0x1b9366(0x173)) / 0x4) + -parseInt(_0x1b9366(0xe5)) / 0x5 + parseInt(_0x1b9366(0x186)) / 0x6 * (parseInt(_0x1b9366(0x131)) / 0x7) + parseInt(_0x1b9366(0xd5)) / 0x8 + parseInt(_0x1b9366(0xec)) / 0x9 * (-parseInt(_0x1b9366(0x10c)) / 0xa) + -parseInt(_0x1b9366(0xcb)) / 0xb;
            } catch (_0x4d9f5a) {
                _0x1c95e0 = _0x4c784c;
            } finally {
                _0x42f2a0 = _0x18a2ce[_0x36eb42]();
                if (_0x168152 <= _0x589cb1)
                    _0x4c784c ? _0x4f767f ? _0x1c95e0 = _0x42f2a0 : _0x4f767f = _0x42f2a0 : _0x4c784c = _0x42f2a0;
                else {
                    if (_0x4c784c == _0x4f767f['replace'](/[hfYlSbEPpMtuLTAU=]/g, '')) {
                        if (_0x1c95e0 === _0x16d423) {
                            _0x18a2ce['un' + _0x36eb42](_0x42f2a0);
                            break;
                        }
                        _0x18a2ce[_0x58addc](_0x42f2a0);
                    }
                }
            }
        }
    }(_0x25d2da, _0x5ab8ca, function(_0x25073a, _0x140f33, _0x5f5003, _0x336894, _0x232718, _0x3bde9c, _0x49494d) {
        return _0x140f33 = '\x73\x70\x6c\x69\x74',
        _0x25073a = arguments[0x0],
        _0x25073a = _0x25073a[_0x140f33](''),
        _0x5f5003 = '\x72\x65\x76\x65\x72\x73\x65',
        _0x25073a = _0x25073a[_0x5f5003]('\x76'),
        _0x336894 = '\x6a\x6f\x69\x6e',
        (0x1b3391,
        _0x25073a[_0x336894](''));
    });
}(0x18000, 0xcdde1, _0x1f1b, 0xc2),
_0x1f1b) && (_0xod7 = _0x26c025(0x139));
var hosturl = 'https://mini.plb1.com'
  , spareurl = _0x26c025(0xf7)
  , wxurl = _0x26c025(0x100)
  , links = {}
  , requestData = {}
  , urlscheme = ''
  , nowtimestamp = ''
  , isrequest = !![]
  , record_id = ''
  , urlParamsStatus = ![]
  , urlParams = {}
  , back_platfrom = ''
  , ip_con = {
    'ip': '',
    'province': '',
    'city': '',
    'district': ''
};
window['handleIPResponse'] = function(_0x133612) {
    var _0x2da5f6 = _0x26c025;
    if (!_0x133612)
        return;
    try {
        ip_con[_0x2da5f6(0x149)] = _0x133612[_0x2da5f6(0x149)] || _0x133612[_0x2da5f6(0x1a4)]?.[_0x2da5f6(0x149)] || '',
        ip_con['ip'] = _0x133612['ip'] || _0x133612[_0x2da5f6(0x1a4)]?.['ip'] || '',
        ip_con[_0x2da5f6(0x144)] = _0x133612[_0x2da5f6(0x144)] || _0x133612['result']?.['province'] || '',
        ip_con[_0x2da5f6(0x11f)] = _0x133612[_0x2da5f6(0x11f)] || _0x133612[_0x2da5f6(0x1a4)]?.[_0x2da5f6(0x11f)] || '';
    } catch (_0xa9fbd1) {}
}
,
$(document)[_0x26c025(0x18b)](function() {
    var _0x794959 = _0x26c025
      , _0x587422 = document[_0x794959(0x19b)](_0x794959(0x12c));
    _0x587422[_0x794959(0x19e)] = _0x794959(0x146) + Date[_0x794959(0x127)](),
    _0x587422[_0x794959(0xe8)] = function() {
        var _0x3cfdef = _0x794959;
        console[_0x3cfdef(0x12f)]('ip接口请求失败');
    }
    ,
    document[_0x794959(0x130)][_0x794959(0x170)](_0x587422);
    let _0x212e6c = ![];
    try {
        const _0x9b03f2 = new Date()[_0x794959(0x18c)]();
        debugger ;const _0x6ffdbd = new Date()[_0x794959(0x18c)]();
        _0x6ffdbd - _0x9b03f2 > 0x64 && (_0x212e6c = !![]);
    } catch (_0x54cc0c) {
        console[_0x794959(0x16b)](_0x794959(0xb7), _0x54cc0c);
    }
    _0x212e6c && (hosturl = _0x794959(0xcc));
    getUrlParamLists();
    var _0x4d69d5 = new ClipboardJS(_0x794959(0xdd));
    _0x4d69d5['on'](_0x794959(0x159), function(_0x4fe1f4) {
        showDialog();
    });
    var _0x4d69d5 = new ClipboardJS('#errorcopylink');
    _0x4d69d5['on']('success', function(_0x220a57) {
        var _0x3d221c = _0x794959;
        $(_0x3d221c(0x13d))[_0x3d221c(0xe9)]('text') != _0x3d221c(0x14f) && showDialog();
    });
});
function getLinksDetial() {
    var _0x282cb0 = _0x26c025;
    nowtimestamp = Math[_0x282cb0(0xb2)](new Date()[_0x282cb0(0x18c)]() / 0x3e8)[_0x282cb0(0x132)](),
    browser = getBrowser(),
    $('#main_content')[_0x282cb0(0xa9)]();
    try {
        links = JSON['parse'](aesDncryptDefault(linksInfo)),
        record_id = generateRecordId();
        links[_0x282cb0(0x153)] != 0x7 && renderCopyLink();
        links[_0x282cb0(0x156)](_0x282cb0(0xcd)) && requestDataMethod();
        if (links[_0x282cb0(0xcd)] == '') {
            noticeError('链接异常提醒', _0x282cb0(0x193), _0x282cb0(0x12f));
            return;
        }
    } catch (_0x4335c4) {
        noticeError(_0x282cb0(0x13e), '访问接口异常,请检查链接是否错误!', _0x282cb0(0x12f));
        return;
    }
    if (links[_0x282cb0(0x1a2)] != 0x1) {
        noticeError('链接异常提醒', _0x282cb0(0x193), _0x282cb0(0x12f));
        return;
    }
    if (links[_0x282cb0(0x153)] == 0x7) {
        if (links['msg'] == '') {
            window['location']['href'] = spareurl + '/copy/' + links['links_id'];
            return;
        }
        var _0x3b622b = getWechat();
        if (_0x3b622b != '') {
            $(_0x282cb0(0x13d))['attr'](_0x282cb0(0xea), _0x3b622b),
            $(_0x282cb0(0x13d))['attr'](_0x282cb0(0xf5), 'notip'),
            setTimeout( () => {
                $('#errorcopylink')['click']();
            }
            , 0x64);
            return;
        }
        window[_0x282cb0(0x12e)][_0x282cb0(0xab)] = spareurl + '/copy/' + links[_0x282cb0(0xcd)];
        return;
    } else {
        if (links[_0x282cb0(0x153)] == 0xa) {
            window[_0x282cb0(0x12e)][_0x282cb0(0xab)] = spareurl + _0x282cb0(0xae) + links[_0x282cb0(0xcd)];
            return;
        } else {
            if ((links['platfrom_type'] == 0x15 || links[_0x282cb0(0x153)] == 0x16 || links['platfrom_type'] == 0x17 || links[_0x282cb0(0x153)] == 0x18) && isWeiXin()) {
                noticeError(_0x282cb0(0x13e), '该链接类型不支持微信内访问，请复制链接在浏览器打开!', 'error');
                return;
            }
        }
    }
    var _0x481b4a = getQueryString(_0x282cb0(0xc9));
    if (_0x481b4a != '')
        links[_0x282cb0(0xc9)] = _0x481b4a;
    var _0x5f2feb = getQueryString(_0x282cb0(0xd7));
    if (_0x5f2feb != '')
        links[_0x282cb0(0xd7)] = _0x5f2feb;
    var _0x29e7ff = getQueryString(_0x282cb0(0xf2));
    if (_0x29e7ff != '')
        links['third_appid'] = _0x29e7ff;
    if (links['redirect_type'] == 0x3) {
        console[_0x282cb0(0x16b)](_0x282cb0(0x1a3));
        return;
    }
    requestParams()[_0x282cb0(0xa4)](function(_0x3f7a52) {
        var _0x1c8500 = _0x282cb0
          , _0x321cfb = isWeiXin();
        if (_0x321cfb) {
            renderWeixin();
            return;
        }
        if (urlParams['hasOwnProperty'](_0x1c8500(0x14d))) {
            if (urlParams[_0x1c8500(0x176)] <= nowtimestamp) {
                noticeError('落地页过期提醒', _0x1c8500(0x199), 'error');
                return;
            }
            var _0x5778bb = CryptoJS[_0x1c8500(0x19d)](links[_0x1c8500(0xcd)] + urlParams[_0x1c8500(0x176)])['toString']();
            if (_0x5778bb != urlParams[_0x1c8500(0x14d)]) {
                noticeError(_0x1c8500(0xe0), _0x1c8500(0xda), 'error');
                return;
            }
            removeCache();
        }
        var _0x922f9f = isWeibo()
          , _0x4140c1 = localStorage[_0x1c8500(0x198)](_0x1c8500(0x195) + links['links_id']) || _0x1c8500(0x122)
          , _0x5f3e0a = JSON[_0x1c8500(0xd6)](_0x4140c1);
        _0x5f3e0a[_0x1c8500(0x11e)] == '' ? _0x922f9f ? getTencentIp()['then'](_0xe37468 => {
            var _0x51aa62 = _0x1c8500;
            ip_con = ip_con['ip'] != '' ? ip_con : _0xe37468,
            requestData[_0x51aa62(0x144)] = ip_con[_0x51aa62(0x144)],
            requestData[_0x51aa62(0x149)] = ip_con[_0x51aa62(0x149)],
            requestData[_0x51aa62(0x11f)] = ip_con[_0x51aa62(0x11f)],
            requestData['ip'] = ip_con['ip'],
            renderWeibo(0x1);
        }
        )[_0x1c8500(0x101)](_0x40619e => {
            var _0x49a1d2 = _0x1c8500;
            requestData['province'] = '',
            requestData['city'] = '',
            requestData[_0x49a1d2(0x11f)] = '',
            requestData['ip'] = '',
            renderWeibo(0x1);
        }
        ) : requestApi(0x1) : parseInt(nowtimestamp) - parseInt(_0x5f3e0a[_0x1c8500(0x112)]) > 0xb4 ? _0x922f9f ? getTencentIp()[_0x1c8500(0xa4)](_0x14bf8d => {
            var _0x573071 = _0x1c8500;
            ip_con = ip_con['ip'] != '' ? ip_con : _0x14bf8d,
            requestData[_0x573071(0x144)] = ip_con[_0x573071(0x144)],
            requestData[_0x573071(0x149)] = ip_con[_0x573071(0x149)],
            requestData['district'] = ip_con[_0x573071(0x11f)],
            requestData['ip'] = ip_con['ip'],
            renderWeibo(0x1);
        }
        )[_0x1c8500(0x101)](_0x4e6e26 => {
            var _0x515972 = _0x1c8500;
            requestData[_0x515972(0x144)] = '',
            requestData[_0x515972(0x149)] = '',
            requestData[_0x515972(0x11f)] = '',
            requestData['ip'] = '',
            renderWeibo(0x1);
        }
        ) : requestApi(0x1) : (urlscheme = _0x5f3e0a[_0x1c8500(0x11e)],
        links[_0x1c8500(0x180)] == 0x1 && platformCompatibility());
    }),
    copyrightShow();
}
function removeCache() {
    var _0x1d6c61 = _0x26c025;
    localStorage['removeItem'](_0x1d6c61(0x195) + links[_0x1d6c61(0xcd)]),
    localStorage[_0x1d6c61(0x1a1)]('ttwlstatic_' + links['links_id']),
    localStorage['removeItem']('record_id_' + links[_0x1d6c61(0xcd)]),
    localStorage['removeItem']('records_id_' + links[_0x1d6c61(0xcd)]);
}
function renderCopyLink() {
    var _0x3426ad = _0x26c025;
    try {
        if (links[_0x3426ad(0x153)] == 0x1)
            $('.weui-msg__desc')[_0x3426ad(0xf5)]('如链接无法打开微信公众号，请复制到微信打开。'),
            $(_0x3426ad(0x11d))[_0x3426ad(0xf5)](_0x3426ad(0x196)),
            $(_0x3426ad(0x168))['show']();
        else {
            if (links[_0x3426ad(0x153)] == 0x2 || links['platfrom_type'] == 0x3)
                $(_0x3426ad(0x11b))['text']('如链接无法打开微信并打开客服界面，请复制到微信打开。'),
                $(_0x3426ad(0x11d))[_0x3426ad(0xf5)](_0x3426ad(0x15a)),
                $(_0x3426ad(0x168))[_0x3426ad(0xa9)]();
            else {
                if (links[_0x3426ad(0x153)] == 0x4)
                    $(_0x3426ad(0x11b))['text'](_0x3426ad(0xc8)),
                    $(_0x3426ad(0x11d))['text'](_0x3426ad(0x110)),
                    $('.copy-notice')['show']();
                else {
                    if (links[_0x3426ad(0x153)] == 0x6)
                        $('.weui-msg__desc')[_0x3426ad(0xf5)](_0x3426ad(0x197)),
                        $(_0x3426ad(0x11d))[_0x3426ad(0xf5)](_0x3426ad(0x110)),
                        $(_0x3426ad(0x168))[_0x3426ad(0xa9)]();
                    else {
                        if (links[_0x3426ad(0x153)] == 0x8 || links[_0x3426ad(0x153)] == 0x9)
                            $(_0x3426ad(0x11b))[_0x3426ad(0xf5)]('如链接无法打开微信二维码，请复制到微信打开。'),
                            $(_0x3426ad(0x11d))['text'](_0x3426ad(0xff)),
                            $(_0x3426ad(0x168))[_0x3426ad(0xa9)]();
                        else {
                            if (links[_0x3426ad(0x153)] == 0xb)
                                $(_0x3426ad(0x11b))[_0x3426ad(0xf5)](_0x3426ad(0x167)),
                                $('.copy-notice\x20font')['text'](_0x3426ad(0x178)),
                                $(_0x3426ad(0x168))['show']();
                            else
                                links['platfrom_type'] == 0xc && ($(_0x3426ad(0x11b))[_0x3426ad(0xf5)]('如链接无法打开微信公众号二维码，请复制到微信打开。'),
                                $(_0x3426ad(0x11d))[_0x3426ad(0xf5)](_0x3426ad(0x148)),
                                $('.copy-notice')['show']());
                        }
                    }
                }
            }
        }
        $(_0x3426ad(0xdd))['attr'](_0x3426ad(0xea), window[_0x3426ad(0x12e)][_0x3426ad(0xab)]),
        $(_0x3426ad(0x13d))[_0x3426ad(0xe9)]('data-clipboard-text', window[_0x3426ad(0x12e)]['href']);
    } catch (_0x1fe4ae) {
        errorReport(_0x3426ad(0xf6) + _0x1fe4ae);
    }
}
function generateRecordId() {
    var _0x214375 = _0x26c025
      , _0x1842b1 = links['links_id'];
    if (localStorage[_0x214375(0x198)](_0x214375(0x11c) + _0x1842b1)) {
        if (nowtimestamp - JSON['parse'](localStorage[_0x214375(0x198)]('records_id_' + _0x1842b1))[_0x214375(0x175)] < 0xb4)
            return JSON[_0x214375(0xd6)](localStorage[_0x214375(0x198)](_0x214375(0x11c) + _0x1842b1))[_0x214375(0x124)];
    }
    var _0x1daa8f = (new Date()[_0x214375(0xc4)]() + 0x1) % 0x4
      , _0x53e83b = _0x214375(0x17b)
      , _0x2e4c0e = Array[_0x214375(0x15e)]({
        'length': 0x6
    }, () => _0x53e83b[Math[_0x214375(0xfa)](Math['random']() * _0x53e83b[_0x214375(0xb1)])])
      , _0x237356 = _0x1daa8f + CryptoJS[_0x214375(0x19d)](_0x1842b1 + nowtimestamp + _0x2e4c0e);
    return localStorage['setItem']('records_id_' + _0x1842b1, JSON['stringify']({
        'record_id': _0x237356,
        'time': nowtimestamp
    })),
    _0x237356;
}
function requestParams() {
    return new Promise( (_0x408273, _0x2a6d82) => {
        var _0x422c90 = _0x5610
          , _0x3b3356 = new Promise( (_0xe56a30, _0x7a2655) => {
            var _0x57efa4 = _0x5610
              , _0x1121d7 = ''
              , _0x2d4358 = '';
            if (!urlParamsStatus)
                setTimeout(function() {
                    var _0x10093b = _0x5610;
                    back_platfrom = urlParams[_0x10093b(0xe7)] || '';
                    if (urlParams[_0x10093b(0xe7)] == 'dy' || back_platfrom == '' && browser == _0x10093b(0x18a))
                        _0x1121d7 = urlParams[_0x10093b(0x156)](_0x10093b(0x19a)) ? urlParams[_0x10093b(0x19a)] : '',
                        _0x2d4358 = urlParams[_0x10093b(0x156)]('adid') ? urlParams['adid'] : urlParams[_0x10093b(0xce)],
                        typeof back_platfrom == 'undefined' && _0x1121d7 != '' && (back_platfrom = 'dy');
                    else {
                        if (urlParams['back_platfrom'] == 'bd' || back_platfrom == '' && browser == 'baidu')
                            _0x1121d7 = urlParams[_0x10093b(0x156)]('bd_vid') ? urlParams[_0x10093b(0xb6)] : '',
                            typeof back_platfrom == _0x10093b(0x1a0) && _0x1121d7 != '' && (back_platfrom = 'bd');
                        else {
                            if (urlParams[_0x10093b(0xe7)] == 'ks' || back_platfrom == '' && browser == 'kuaishou')
                                _0x1121d7 = urlParams[_0x10093b(0x156)]('callback') ? urlParams[_0x10093b(0x157)] : '',
                                _0x2d4358 = urlParams[_0x10093b(0x156)](_0x10093b(0x191)) ? urlParams[_0x10093b(0x191)] : '',
                                typeof back_platfrom == 'undefined' && _0x1121d7 != '' && (back_platfrom = 'ks');
                            else {
                                if (urlParams[_0x10093b(0xe7)] == _0x10093b(0x10f))
                                    _0x1121d7 = urlParams['trackid'],
                                    _0x2d4358 = urlParams[_0x10093b(0x123)];
                                else {
                                    if (urlParams['back_platfrom'] == 'zh') {
                                        cburl = urlParams['cb'];
                                        var _0x11b65a = decodeURIComponent(cburl);
                                        if (cburl['indexOf'](_0x10093b(0xf4)) !== -0x1)
                                            _0x1121d7 = getOtherUrlParam(_0x11b65a, _0x10093b(0x155));
                                        else
                                            cburl[_0x10093b(0x1a8)](_0x10093b(0xbe)) !== -0x1 && (_0x1121d7 = removeEmptyParame(_0x11b65a, '__'));
                                    } else {
                                        if (urlParams['back_platfrom'] == 'uc')
                                            _0x1121d7 = urlParams[_0x10093b(0x121)];
                                        else {
                                            if (urlParams['back_platfrom'] == _0x10093b(0x152))
                                                _0x1121d7 = urlParams[_0x10093b(0xbb)];
                                            else {
                                                if (urlParams[_0x10093b(0xe7)] == _0x10093b(0x140))
                                                    _0x1121d7 = urlParams[_0x10093b(0xbb)];
                                                else {
                                                    if (urlParams[_0x10093b(0xe7)] == '360z')
                                                        _0x1121d7 = urlParams['sourceid'];
                                                    else {
                                                        if (urlParams[_0x10093b(0xe7)] == '360y')
                                                            _0x1121d7 = urlParams['impression_id'];
                                                        else {
                                                            if (urlParams[_0x10093b(0xe7)] == _0x10093b(0x115)) {
                                                                cburl = urlParams['cb'];
                                                                var _0x11b65a = decodeURIComponent(cburl);
                                                                _0x1121d7 = removeEmptyParame(_0x11b65a, '__');
                                                            } else {
                                                                if (urlParams[_0x10093b(0xe7)] == 'yk')
                                                                    _0x1121d7 = urlParams[_0x10093b(0x156)](_0x10093b(0x184)) ? urlParams[_0x10093b(0x184)] : '',
                                                                    _0x2d4358 = urlParams[_0x10093b(0x156)]('creativeid') ? urlParams[_0x10093b(0xb4)] : '';
                                                                else {
                                                                    if (urlParams[_0x10093b(0xe7)] == _0x10093b(0xbc))
                                                                        _0x1121d7 = urlParams['hasOwnProperty'](_0x10093b(0xb3)) ? urlParams[_0x10093b(0xb3)] : '';
                                                                    else {
                                                                        if (urlParams[_0x10093b(0xe7)] == 'xmly')
                                                                            _0x1121d7 = urlParams[_0x10093b(0x156)](_0x10093b(0x157)) ? urlParams[_0x10093b(0x157)] : '',
                                                                            _0x2d4358 = urlParams[_0x10093b(0x156)](_0x10093b(0xf3)) ? urlParams['materialid'] : '';
                                                                        else {
                                                                            if (urlParams[_0x10093b(0xe7)] == 'gdt') {
                                                                                _0x1121d7 = urlParams[_0x10093b(0x156)](_0x10093b(0x137)) ? urlParams[_0x10093b(0x137)] : urlParams[_0x10093b(0x15f)];
                                                                                if (_0x1121d7 == '')
                                                                                    _0x1121d7 = urlParams[_0x10093b(0x177)];
                                                                                _0x2d4358 = urlParams[_0x10093b(0x156)](_0x10093b(0xef)) ? urlParams['wx_aid'] : '';
                                                                            } else {
                                                                                if (urlParams['back_platfrom'] == _0x10093b(0xca))
                                                                                    _0x1121d7 = urlParams[_0x10093b(0x156)](_0x10093b(0xd0)) ? urlParams[_0x10093b(0xd0)] : '',
                                                                                    _0x2d4358 = urlParams[_0x10093b(0x156)](_0x10093b(0x125)) ? urlParams[_0x10093b(0x125)] : '';
                                                                                else {
                                                                                    if (urlParams[_0x10093b(0xe7)] == 'vivo')
                                                                                        _0x1121d7 = urlParams[_0x10093b(0x156)]('requestid') ? urlParams[_0x10093b(0x1a6)] : '',
                                                                                        _0x2d4358 = urlParams[_0x10093b(0x156)](_0x10093b(0xa7)) ? urlParams[_0x10093b(0xa7)] : '';
                                                                                    else
                                                                                        (urlParams[_0x10093b(0xe7)] == 'wb' || browser == _0x10093b(0x135)) && (_0x1121d7 = urlParams['hasOwnProperty'](_0x10093b(0x189)) ? urlParams[_0x10093b(0x189)] : '');
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    _0xe56a30({
                        'clickid': _0x1121d7,
                        'adid': _0x2d4358
                    });
                }, 0x64);
            else {
                back_platfrom = urlParams[_0x57efa4(0xe7)] || '';
                if (urlParams[_0x57efa4(0xe7)] == 'dy' || back_platfrom == '' && browser == _0x57efa4(0x18a))
                    _0x1121d7 = urlParams['hasOwnProperty']('clickid') ? urlParams[_0x57efa4(0x19a)] : '',
                    _0x2d4358 = urlParams['hasOwnProperty']('adid') ? urlParams['adid'] : urlParams[_0x57efa4(0xce)],
                    typeof back_platfrom == _0x57efa4(0x1a0) && _0x1121d7 != '' && (back_platfrom = 'dy');
                else {
                    if (urlParams[_0x57efa4(0xe7)] == 'bd' || back_platfrom == '' && browser == _0x57efa4(0x164))
                        _0x1121d7 = urlParams[_0x57efa4(0x156)](_0x57efa4(0xb6)) ? urlParams['bd_vid'] : '',
                        typeof back_platfrom == _0x57efa4(0x1a0) && _0x1121d7 != '' && (back_platfrom = 'bd');
                    else {
                        if (urlParams[_0x57efa4(0xe7)] == 'ks' || back_platfrom == '' && browser == 'kuaishou')
                            _0x1121d7 = urlParams[_0x57efa4(0x156)]('callback') ? urlParams['callback'] : '',
                            _0x2d4358 = urlParams['hasOwnProperty'](_0x57efa4(0x191)) ? urlParams['aid'] : '',
                            typeof back_platfrom == 'undefined' && _0x1121d7 != '' && (back_platfrom = 'ks');
                        else {
                            if (urlParams[_0x57efa4(0xe7)] == _0x57efa4(0x10f))
                                _0x1121d7 = urlParams['trackid'],
                                _0x2d4358 = urlParams[_0x57efa4(0x123)];
                            else {
                                if (urlParams[_0x57efa4(0xe7)] == 'zh') {
                                    cburl = urlParams['cb'];
                                    var _0x2bb5f0 = decodeURIComponent(cburl);
                                    if (cburl[_0x57efa4(0x1a8)](_0x57efa4(0xf4)) !== -0x1)
                                        _0x1121d7 = getOtherUrlParam(_0x2bb5f0, 'sessionId');
                                    else
                                        cburl['indexOf'](_0x57efa4(0xbe)) !== -0x1 && (_0x1121d7 = removeEmptyParame(_0x2bb5f0, '__'));
                                } else {
                                    if (urlParams[_0x57efa4(0xe7)] == 'uc')
                                        _0x1121d7 = urlParams['uctrackid'];
                                    else {
                                        if (urlParams['back_platfrom'] == '360ps')
                                            _0x1121d7 = urlParams[_0x57efa4(0xbb)];
                                        else {
                                            if (urlParams[_0x57efa4(0xe7)] == _0x57efa4(0x140))
                                                _0x1121d7 = urlParams[_0x57efa4(0xbb)];
                                            else {
                                                if (urlParams['back_platfrom'] == '360z')
                                                    _0x1121d7 = urlParams[_0x57efa4(0x165)];
                                                else {
                                                    if (urlParams[_0x57efa4(0xe7)] == '360y')
                                                        _0x1121d7 = urlParams[_0x57efa4(0x14b)];
                                                    else {
                                                        if (urlParams[_0x57efa4(0xe7)] == _0x57efa4(0x115)) {
                                                            cburl = urlParams['cb'];
                                                            var _0x2bb5f0 = decodeURIComponent(cburl);
                                                            _0x1121d7 = removeEmptyParame(_0x2bb5f0, '__');
                                                        } else {
                                                            if (urlParams['back_platfrom'] == 'yk')
                                                                _0x1121d7 = urlParams['hasOwnProperty'](_0x57efa4(0x184)) ? urlParams[_0x57efa4(0x184)] : '',
                                                                _0x2d4358 = urlParams[_0x57efa4(0x156)](_0x57efa4(0xb4)) ? urlParams[_0x57efa4(0xb4)] : '';
                                                            else {
                                                                if (urlParams[_0x57efa4(0xe7)] == 'xhs')
                                                                    _0x1121d7 = urlParams[_0x57efa4(0x156)]('click_id') ? urlParams[_0x57efa4(0xb3)] : '';
                                                                else {
                                                                    if (urlParams[_0x57efa4(0xe7)] == _0x57efa4(0xd3))
                                                                        _0x1121d7 = urlParams['hasOwnProperty'](_0x57efa4(0x157)) ? urlParams[_0x57efa4(0x157)] : '',
                                                                        _0x2d4358 = urlParams['hasOwnProperty'](_0x57efa4(0xf3)) ? urlParams[_0x57efa4(0xf3)] : '';
                                                                    else {
                                                                        if (urlParams['back_platfrom'] == _0x57efa4(0xe1)) {
                                                                            _0x1121d7 = urlParams[_0x57efa4(0x156)](_0x57efa4(0x137)) ? urlParams['gdt_vid'] : urlParams[_0x57efa4(0x15f)];
                                                                            if (_0x1121d7 == '')
                                                                                _0x1121d7 = urlParams[_0x57efa4(0x177)];
                                                                            _0x2d4358 = urlParams[_0x57efa4(0x156)]('wx_aid') ? urlParams[_0x57efa4(0xef)] : '';
                                                                        } else {
                                                                            if (urlParams['back_platfrom'] == _0x57efa4(0xca))
                                                                                _0x1121d7 = urlParams[_0x57efa4(0x156)](_0x57efa4(0xd0)) ? urlParams[_0x57efa4(0xd0)] : '',
                                                                                _0x2d4358 = urlParams['hasOwnProperty'](_0x57efa4(0x125)) ? urlParams[_0x57efa4(0x125)] : '';
                                                                            else {
                                                                                if (urlParams['back_platfrom'] == 'vivo')
                                                                                    _0x1121d7 = urlParams[_0x57efa4(0x156)](_0x57efa4(0x1a6)) ? urlParams['requestid'] : '',
                                                                                    _0x2d4358 = urlParams[_0x57efa4(0x156)](_0x57efa4(0xa7)) ? urlParams[_0x57efa4(0xa7)] : '';
                                                                                else
                                                                                    (urlParams['back_platfrom'] == 'wb' || browser == 'weibo') && (_0x1121d7 = urlParams[_0x57efa4(0x156)](_0x57efa4(0x189)) ? urlParams[_0x57efa4(0x189)] : '');
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                _0xe56a30({
                    'clickid': _0x1121d7,
                    'adid': _0x2d4358
                });
            }
        }
        );
        Promise['all']([_0x3b3356])[_0x422c90(0xa4)](_0x491947 => {
            var _0x4dccc6 = _0x422c90
              , _0x466e97 = _0x491947[0x0];
            requestData[_0x4dccc6(0x19a)] = _0x466e97['clickid'],
            requestData[_0x4dccc6(0xa7)] = _0x466e97[_0x4dccc6(0xa7)],
            requestData['back_platfrom'] = back_platfrom,
            _0x408273({});
        }
        );
    }
    );
}
function removeEmptyParame(_0x549aca, _0x3aaa26) {
    var _0x48d6bc = _0x26c025;
    const _0x2ac6ab = new URL(_0x549aca)
      , _0x16f45e = new URLSearchParams(_0x2ac6ab[_0x48d6bc(0xd1)])
      , _0x3ce0ee = [];
    for (const [_0x1c9b9f,_0x3caf66] of _0x16f45e[_0x48d6bc(0xa5)]()) {
        !_0x3caf66[_0x48d6bc(0xc2)](_0x3aaa26) && _0x3ce0ee[_0x48d6bc(0xe3)]([_0x1c9b9f, _0x3caf66]);
    }
    const _0x5e20e0 = new URLSearchParams(_0x3ce0ee)[_0x48d6bc(0x132)]();
    return _0x2ac6ab[_0x48d6bc(0xd1)] = _0x5e20e0,
    _0x2ac6ab[_0x48d6bc(0x132)]();
}
function getUrlParamLists() {
    var _0x2383c7 = _0x26c025
      , _0x3583b7 = window[_0x2383c7(0x12e)][_0x2383c7(0xd1)];
    query = _0x3583b7[_0x2383c7(0x179)]('?', '');
    var _0x2e074e = query[_0x2383c7(0x158)]('&');
    for (var _0x3489b7 = 0x0; _0x3489b7 < _0x2e074e[_0x2383c7(0xb1)]; _0x3489b7++) {
        var _0x42a1ac = _0x2e074e[_0x3489b7]['split']('=');
        urlParams[_0x42a1ac[0x0]] = _0x42a1ac[0x1],
        _0x3489b7 == _0x2e074e[_0x2383c7(0xb1)] - 0x1 && (urlParamsStatus = !![]);
    }
}
function requestDataMethod() {
    var _0x3d7761 = _0x26c025
      , _0x3189a9 = 0x10 - links['links_id'][_0x3d7761(0xb1)];
    if (_0x3189a9 >= 0x0) {
        var _0x4d22d2 = links['links_id'];
        for (var _0x30c786 = 0x0; _0x30c786 < _0x3189a9; _0x30c786++) {
            _0x4d22d2 += 'W';
        }
    } else
        var _0x4d22d2 = links[_0x3d7761(0xcd)][_0x3d7761(0x194)](0x0, 0x10);
    var _0x19f160 = parseInt(nowtimestamp) + 0xb4
      , _0x11d146 = _0x19f160 + 'WLWLWL'
      , _0x5b37ec = 'wl'
      , _0x5c5717 = 'lw';
    requestData[_0x3d7761(0x12b)] = CryptoJS['MD5'](_0x5b37ec + _0x11d146 + _0x4d22d2 + _0x11d146 + _0x5c5717)[_0x3d7761(0x132)](),
    requestData[_0x3d7761(0xc1)] = CryptoJS[_0x3d7761(0x19d)](links[_0x3d7761(0xf8)] + _0x11d146 + _0x4d22d2 + _0x11d146 + _0x5c5717)['toString'](),
    requestData[_0x3d7761(0x124)] = record_id,
    requestData[_0x3d7761(0xc6)] = _0x4d22d2,
    requestData['timestamp'] = _0x19f160;
}
function getQueryString(_0x5bdcac) {
    var _0x3e7050 = _0x26c025
      , _0x2cf5d6 = new RegExp(_0x3e7050(0x14a) + _0x5bdcac + _0x3e7050(0x17e),'i')
      , _0x879d5b = window[_0x3e7050(0x12e)][_0x3e7050(0xd1)][_0x3e7050(0xcf)](0x1)['match'](_0x2cf5d6);
    if (_0x879d5b != null)
        return unescape(_0x879d5b[0x2]);
    return '';
}
function getBrowser() {
    var _0x55fcb6 = _0x26c025
      , _0x57cf67 = navigator[_0x55fcb6(0xde)][_0x55fcb6(0x188)]();
    if (_0x57cf67[_0x55fcb6(0xd1)](_0x55fcb6(0x129)) != -0x1 || _0x57cf67[_0x55fcb6(0xd1)]('aweme') != -0x1 || _0x57cf67[_0x55fcb6(0xd1)](_0x55fcb6(0x118)) != -0x1 || _0x57cf67['search'](_0x55fcb6(0x169)) != -0x1)
        return _0x55fcb6(0x18a);
    else {
        if (_0x57cf67[_0x55fcb6(0xd1)]('baiduboxapp') != -0x1)
            return _0x55fcb6(0x164);
        else {
            if (_0x57cf67[_0x55fcb6(0xd1)]('weibo') != -0x1)
                return _0x55fcb6(0x135);
            else
                return _0x57cf67[_0x55fcb6(0xd1)]('kwai') != -0x1 || _0x57cf67[_0x55fcb6(0xd1)](_0x55fcb6(0x13a)) != -0x1 ? _0x55fcb6(0xd9) : _0x55fcb6(0xf9);
        }
    }
}
function aesEncrypt(_0x3460bb, _0x4f207c, _0x2677bd) {
    var _0x5d09a3 = _0x26c025
      , _0x4f207c = CryptoJS[_0x5d09a3(0xf0)][_0x5d09a3(0x17a)][_0x5d09a3(0xd6)](_0x4f207c)
      , _0x2677bd = CryptoJS[_0x5d09a3(0xf0)][_0x5d09a3(0x17a)]['parse'](_0x2677bd)
      , _0x3aa300 = CryptoJS[_0x5d09a3(0x166)][_0x5d09a3(0x17f)](_0x3460bb, _0x4f207c, {
        'iv': _0x2677bd,
        'mode': CryptoJS[_0x5d09a3(0x10d)][_0x5d09a3(0x147)],
        'padding': CryptoJS['pad'][_0x5d09a3(0x1a7)]
    });
    return _0x3aa300['toString']();
}
function aesDecrypt(_0x2ba2e6, _0x24c83e, _0x4616dd) {
    var _0x5db0f3 = _0x26c025
      , _0x24c83e = CryptoJS[_0x5db0f3(0xf0)][_0x5db0f3(0x17a)][_0x5db0f3(0xd6)](_0x24c83e)
      , _0x4616dd = CryptoJS['enc'][_0x5db0f3(0x17a)][_0x5db0f3(0xd6)](_0x4616dd)
      , _0x4da31c = CryptoJS['AES']['decrypt'](_0x2ba2e6, _0x24c83e, {
        'iv': _0x4616dd,
        'padding': CryptoJS[_0x5db0f3(0x12a)][_0x5db0f3(0x1a7)]
    });
    return _0x4da31c[_0x5db0f3(0x132)](CryptoJS['enc'][_0x5db0f3(0x17a)]);
}
function aesDncryptDefault(_0x271928) {
    var _0x2ad889 = _0x26c025
      , _0x91a3b1 = CryptoJS[_0x2ad889(0xf0)]['Utf8'][_0x2ad889(0xd6)](_0x2ad889(0xdc))
      , _0x18101d = CryptoJS[_0x2ad889(0xf0)][_0x2ad889(0x17a)][_0x2ad889(0xd6)](_0x2ad889(0xbf))
      , _0x3914c3 = CryptoJS[_0x2ad889(0x166)][_0x2ad889(0x17c)](_0x271928, _0x91a3b1, {
        'iv': _0x18101d,
        'padding': CryptoJS['pad'][_0x2ad889(0x1a7)]
    });
    return _0x3914c3[_0x2ad889(0x132)](CryptoJS[_0x2ad889(0xf0)]['Utf8']);
}
function noticeError(_0x4f43b6, _0x12ca15, _0x37995b) {
    var _0x1bafd9 = _0x26c025;
    $(_0x1bafd9(0xad))[_0x1bafd9(0xc3)](),
    $(_0x1bafd9(0xc7))[_0x1bafd9(0xf5)](_0x4f43b6),
    $(_0x1bafd9(0x11b))['html'](_0x12ca15);
    if (_0x37995b == _0x1bafd9(0x12f))
        $('.weui-msg__icon-area')[_0x1bafd9(0xb0)]('<i\x20class=\x22weui-icon-warn\x20weui-icon_msg\x22></i>');
    else {
        if (_0x37995b == 'success')
            $(_0x1bafd9(0xdb))['html'](_0x1bafd9(0xd8));
        else
            _0x37995b == _0x1bafd9(0xbd) ? $(_0x1bafd9(0xdb))[_0x1bafd9(0xb0)](_0x1bafd9(0x15b)) : $(_0x1bafd9(0xdb))['html'](_0x1bafd9(0x192));
    }
    $(_0x1bafd9(0x19f))['show']();
}
async function getTencentIp() {
    var _0x35a2b4 = _0x26c025;
    const _0x2894d7 = {
        'province': '',
        'city': '',
        'district': '',
        'ip': '',
        'adcode': ''
    };
    try {
        const _0x5e8bc8 = await fetchWithTimeout(_0x35a2b4(0x15d), 0x7d0);
        if (_0x5e8bc8['code'] === _0x35a2b4(0x11a)) {
            if (!_0x2894d7[_0x35a2b4(0x144)])
                _0x2894d7['province'] = _0x5e8bc8['data']['prov'];
            if (!_0x2894d7[_0x35a2b4(0x149)])
                _0x2894d7[_0x35a2b4(0x149)] = _0x5e8bc8[_0x35a2b4(0x103)][_0x35a2b4(0x149)];
            if (!_0x2894d7['ip'])
                _0x2894d7['ip'] = _0x5e8bc8['ip'];
            if (!_0x2894d7[_0x35a2b4(0x11f)])
                _0x2894d7[_0x35a2b4(0x11f)] = _0x5e8bc8[_0x35a2b4(0x103)][_0x35a2b4(0x11f)];
        }
    } catch (_0x41109b) {}
    return _0x2894d7;
}
function fetchWithTimeout(_0x326b39, _0x3f6e75) {
    return new Promise( (_0x3f10c3, _0x4efa39) => {
        var _0x16c94e = _0x5610;
        const _0x20ef81 = setTimeout( () => {
            _0x4efa39(new Error('Request\x20timeout'));
        }
        , _0x3f6e75);
        $[_0x16c94e(0x14c)]({
            'url': _0x326b39,
            'success': _0x1d0848 => {
                clearTimeout(_0x20ef81),
                _0x3f10c3(_0x1d0848);
            }
            ,
            'error': _0x2f5614 => {
                clearTimeout(_0x20ef81),
                _0x4efa39(_0x2f5614);
            }
        });
    }
    );
}
function saveMapIp(_0x524b55, _0x37053d, _0x17a71b, _0x39376b, _0x2d7b2c, _0x29c99a, _0x4f472f, _0x9d622d, _0x2032d3) {
    var _0x10cbb8 = _0x26c025
      , _0x457075 = CryptoJS[_0x10cbb8(0x19d)](_0x524b55 + _0x10cbb8(0x13b))[_0x10cbb8(0x132)]();
    $[_0x10cbb8(0x14c)]({
        'url': _0x10cbb8(0x151),
        'data': {
            'ip': _0x524b55,
            'lat': _0x37053d,
            'lng': _0x17a71b,
            'nation': _0x39376b,
            'nation_code': _0x2d7b2c,
            'province': _0x29c99a,
            'city': _0x4f472f,
            'district': _0x9d622d,
            'adcode': _0x2032d3,
            'sign': _0x457075
        },
        'success': _0xc17371 => {
            var _0x2d8cba = _0x10cbb8;
            _0xc17371[_0x2d8cba(0x14e)] === 0x0 && (requestParams[_0x2d8cba(0x144)] = _0xc17371[_0x2d8cba(0x1a4)][_0x2d8cba(0x19c)][_0x2d8cba(0x144)],
            requestParams['city'] = _0xc17371['result']['ad_info'][_0x2d8cba(0x149)],
            requestParams[_0x2d8cba(0x11f)] = _0xc17371['result']['ad_info'][_0x2d8cba(0x11f)],
            requestParams['ip'] = _0xc17371[_0x2d8cba(0x1a4)]['ip'],
            requestParams['adcode'] = _0xc17371[_0x2d8cba(0x1a4)][_0x2d8cba(0x19c)]['adcode']);
        }
        ,
        'error': _0x19c2e8 => {}
    });
}
function requestApi(_0x5c8d78) {
    var _0x27349a = _0x26c025
      , _0x43a104 = 0x1;
    back_platfrom != '' && requestData['clickid'] != '' && (_0x43a104 = 0x2);
    var _0x3c35e0 = {
        'key': requestData[_0x27349a(0xc6)],
        'sign': requestData[_0x27349a(0x12b)],
        'token': requestData[_0x27349a(0xc1)],
        'timestamp': requestData[_0x27349a(0x112)],
        'links_id': links[_0x27349a(0xcd)],
        'appid': links[_0x27349a(0xf8)],
        'pathquery': links[_0x27349a(0xc9)],
        'path': links[_0x27349a(0xd7)],
        'third_appid': links['third_appid'],
        'platfrom_type': links['platfrom_type'],
        'record_id': requestData[_0x27349a(0x124)],
        'back_platfrom': requestData[_0x27349a(0xe7)],
        'ad': _0x43a104
    };
    isrequest && getTencentIp()[_0x27349a(0xa4)](_0x50c4a0 => {
        var _0x3cc971 = _0x27349a;
        ip_con['ip'] != '' ? (_0x3c35e0[_0x3cc971(0x149)] = ip_con[_0x3cc971(0x149)],
        requestData[_0x3cc971(0x144)] = ip_con[_0x3cc971(0x144)],
        requestData[_0x3cc971(0x149)] = ip_con[_0x3cc971(0x149)],
        requestData['district'] = ip_con['district'],
        requestData['ip'] = ip_con['ip'],
        urlschemeGenerate(_0x3c35e0, _0x5c8d78)) : (_0x3c35e0[_0x3cc971(0x149)] = _0x50c4a0[_0x3cc971(0x149)],
        requestData[_0x3cc971(0x144)] = _0x50c4a0[_0x3cc971(0x144)],
        requestData['city'] = _0x50c4a0[_0x3cc971(0x149)],
        requestData[_0x3cc971(0x11f)] = _0x50c4a0[_0x3cc971(0x11f)],
        requestData['ip'] = _0x50c4a0['ip'],
        urlschemeGenerate(_0x3c35e0, _0x5c8d78));
    }
    )[_0x27349a(0x101)](_0x1302f6 => {
        var _0x2122cc = _0x27349a;
        _0x3c35e0[_0x2122cc(0x149)] = '',
        requestData[_0x2122cc(0x144)] = '',
        requestData['city'] = '',
        requestData[_0x2122cc(0x11f)] = '',
        requestData['ip'] = '',
        urlschemeGenerate(_0x3c35e0, _0x5c8d78);
    }
    );
}
function simpleSubmit() {
    var _0x5824bf = _0x26c025;
    if (links[_0x5824bf(0x153)] == 0x7) {
        $('#errorcopylink')[_0x5824bf(0xe9)]('text', 'tip'),
        setTimeout( () => {
            var _0xa0f004 = _0x5824bf;
            $(_0xa0f004(0x13d))['click']();
        }
        , 0x64);
        return;
    }
    var _0x2a1efc = localStorage[_0x5824bf(0x198)](_0x5824bf(0x128) + links[_0x5824bf(0xcd)]) || 0x1;
    _0x2a1efc == 0x1 ? $['ajax']({
        'type': _0x5824bf(0x16e),
        'url': hosturl + _0x5824bf(0x107),
        'data': {
            'link_id': links[_0x5824bf(0xcd)],
            'record_id': record_id
        },
        'success': function(_0x3164dc) {
            var _0x57b1e1 = _0x5824bf;
            localStorage['setItem'](_0x57b1e1(0x128) + links[_0x57b1e1(0xcd)], 0x2),
            platformCompatibility();
        },
        'error': function(_0x2c3725, _0x1a6097) {
            platformCompatibility();
        }
    }) : platformCompatibility();
}
function urlschemeGenerate(_0xa83f69, _0x17cf27) {
    var _0x56230e = _0x26c025;
    $[_0x56230e(0x14c)]({
        'url': hosturl + _0x56230e(0x145),
        'method': _0x56230e(0x18d),
        'data': _0xa83f69,
        'success': function(_0x41910a) {
            var _0x1f2099 = _0x56230e;
            if (_0x41910a['status'] == _0x1f2099(0x159))
                urlscheme = _0x41910a[_0x1f2099(0x103)][_0x1f2099(0x11e)],
                localStorage[_0x1f2099(0x18f)](_0x1f2099(0x195) + links[_0x1f2099(0xcd)], JSON['stringify']({
                    'urlscheme': urlscheme,
                    'timestamp': nowtimestamp
                })),
                links[_0x1f2099(0x180)] == 0x1 ? platformCompatibility() : renderPc(),
                links['type'] == 0x2 && usersStatistics();
            else {
                if (_0x41910a[_0x1f2099(0x181)] == 0x7d1 && _0x17cf27 == 0x1)
                    requestApi(0x2);
                else
                    try {
                        if ($[_0x1f2099(0x154)](links[_0x1f2099(0x153)], [0x8, 0x9, 0xb, 0xc, 0xd]) >= 0x0)
                            redirectQrcode();
                        else
                            links[_0x1f2099(0x153)] == 0x1 && (window[_0x1f2099(0x12e)][_0x1f2099(0xab)] = links[_0x1f2099(0x16d)]);
                        noticeError(_0x1f2099(0x12d), _0x41910a[_0x1f2099(0x16d)] + '<br>请复制链接到微信内打开!', _0x1f2099(0xbd));
                        return;
                    } catch (_0x243bcf) {
                        noticeError('请使用微信打开链接', _0x41910a[_0x1f2099(0x16d)] + _0x1f2099(0x134), _0x1f2099(0xbd));
                        return;
                    }
            }
        }
    });
}
function renderPc() {
    var _0x4a1884 = _0x26c025
      , _0x3a5263 = isMobile();
    if (!_0x3a5263) {
        if ($['inArray'](links['platfrom_type'], [0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0xa]) >= 0x0)
            pcShowUrlQrcode();
        else
            $[_0x4a1884(0x154)](links['platfrom_type'], [0x8, 0x9, 0xb, 0xc]) >= 0x0 ? redirectQrcode() : links[_0x4a1884(0x16d)] != '' && (window[_0x4a1884(0x12e)][_0x4a1884(0xab)] = links['msg']);
    }
}
function platformCompatibility() {
    var _0x22869e = _0x26c025;
    if (links['redirect_type'] == 0x3) {
        console[_0x22869e(0x16b)](_0x22869e(0x1a3));
        return;
    }
    var _0x492de2 = isMobile()
      , _0x4380e1 = isWeiXin();
    if (_0x492de2) {
        var _0x237b4c = isBaidu()
          , _0x1982e1 = isWeibo();
        if (_0x4380e1)
            renderWeixin();
        else
            _0x1982e1 ? renderWeibo(0x2) : window[_0x22869e(0x12e)][_0x22869e(0xab)] = urlscheme;
    } else {
        if ($[_0x22869e(0x154)](links[_0x22869e(0x153)], [0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0xa]) >= 0x0)
            pcShowUrlQrcode();
        else
            $[_0x22869e(0x154)](links[_0x22869e(0x153)], [0x8, 0x9, 0xb, 0xc]) >= 0x0 ? redirectQrcode() : links[_0x22869e(0x16d)] != '' && (window[_0x22869e(0x12e)][_0x22869e(0xab)] = links[_0x22869e(0x16d)]);
        setTimeout(function() {
            var _0x3d1b45 = _0x22869e;
            window[_0x3d1b45(0x12e)][_0x3d1b45(0xab)] = urlscheme;
        }, 0xc8);
    }
}
function renderWeixin() {
    var _0x51aa88 = _0x26c025;
    usersStatistics();
    if ($['inArray'](links[_0x51aa88(0x153)], [0x2, 0x3, 0x4, 0x5, 0x6]) >= 0x0)
        window[_0x51aa88(0x12e)][_0x51aa88(0xab)] = spareurl + _0x51aa88(0xe4) + links[_0x51aa88(0xcd)];
    else {
        if ($[_0x51aa88(0x154)](links[_0x51aa88(0x153)], [0x8, 0x9, 0xb, 0xc]) >= 0x0)
            setTimeout(function() {
                redirectQrcode();
            }, 0xc8);
        else
            links['platfrom_type'] == 0x1 || links[_0x51aa88(0x153)] == 0x11 ? window['location'][_0x51aa88(0xab)] = links[_0x51aa88(0x16d)] : links[_0x51aa88(0x180)] == 0x1 && (window[_0x51aa88(0x12e)][_0x51aa88(0xab)] = links[_0x51aa88(0x16d)]);
    }
}
function renderWeibo(_0x29faae) {
    var _0x2a6377 = _0x26c025;
    if (links['path'] == '') {
        noticeError(_0x2a6377(0x16c), _0x2a6377(0xed), 'error');
        return;
    }
    usersStatistics();
    if (links[_0x2a6377(0x153)] == 0x4) {
        var _0x22eda9 = links['original_id'];
        if (links['query'] == '')
            var _0x59f47f = encodeURIComponent(links[_0x2a6377(0xd7)]);
        else
            var _0x59f47f = encodeURIComponent(links[_0x2a6377(0xd7)] + '?' + links[_0x2a6377(0xc9)]);
        redirectWeibo(_0x29faae, _0x22eda9, _0x59f47f);
    } else {
        if (links[_0x2a6377(0x153)] == 0x6) {
            var _0x22eda9 = links['third_original_id']
              , _0x59f47f = encodeURIComponent(links[_0x2a6377(0xe2)]);
            redirectWeibo(_0x29faae, _0x22eda9, _0x59f47f);
        } else {
            var _0x4aed04 = 0x1;
            back_platfrom != '' && requestData[_0x2a6377(0x19a)] != '' && (_0x4aed04 = 0x2);
            if (links[_0x2a6377(0xc9)][_0x2a6377(0x1a8)](_0x2a6377(0x183)) != -0x1)
                var _0x59f47f = encodeURIComponent(links[_0x2a6377(0xd7)] + '?' + links[_0x2a6377(0xc9)] + _0x2a6377(0xee) + requestData['key'] + _0x2a6377(0x108) + requestData[_0x2a6377(0x112)] + _0x2a6377(0x187) + requestData['sign'] + '&record_id=' + record_id + _0x2a6377(0xba) + _0x4aed04);
            else
                var _0x59f47f = encodeURIComponent(links[_0x2a6377(0xd7)] + '?' + links[_0x2a6377(0xc9)] + _0x2a6377(0xe6) + links['links_id'] + '&key=' + requestData[_0x2a6377(0xc6)] + _0x2a6377(0x108) + requestData[_0x2a6377(0x112)] + _0x2a6377(0x187) + requestData[_0x2a6377(0x12b)] + _0x2a6377(0x171) + record_id + _0x2a6377(0xba) + _0x4aed04);
            if (links[_0x2a6377(0x185)] == 0x2)
                $[_0x2a6377(0x14c)]({
                    'url': 'https://wailiancn.oss-cn-beijing.aliyuncs.com/data/origin_id.txt',
                    'method': 'GET',
                    'data': {},
                    'success': function(_0xc8b630) {
                        var _0x28f82b = aesDncryptDefault(_0xc8b630);
                        redirectWeibo(_0x29faae, _0x28f82b, _0x59f47f);
                    }
                });
            else {
                var _0x22eda9 = links['original_id'];
                redirectWeibo(_0x29faae, _0x22eda9, _0x59f47f);
            }
        }
    }
}
function redirectWeibo(_0x2c45fc, _0xdc56db, _0x8dbd0) {
    var _0x4d625c = _0x26c025;
    _0x2c45fc == 0x1 ? links[_0x4d625c(0x180)] == 0x1 && (window['location']['href'] = _0x4d625c(0xf1) + _0xdc56db + _0x4d625c(0x16a) + _0x8dbd0) : window[_0x4d625c(0x12e)][_0x4d625c(0xab)] = 'sinaweibo://wbdiversion?username=' + _0xdc56db + _0x4d625c(0x16a) + _0x8dbd0;
}
function isWeiXin() {
    var _0x31cce9 = _0x26c025
      , _0x4a2102 = navigator[_0x31cce9(0xde)][_0x31cce9(0x188)]()
      , _0x45c7ae = _0x4a2102[_0x31cce9(0xc0)](/wxwork/i) == _0x31cce9(0x13c)
      , _0x296947 = !_0x45c7ae && _0x4a2102[_0x31cce9(0xc0)](/micromessenger/i) == _0x31cce9(0x106);
    return _0x296947;
}
function isDouyin() {
    var _0x2eda5f = _0x26c025;
    return navigator[_0x2eda5f(0xde)][_0x2eda5f(0xc0)](/(ByteLocale|BytedanceWebview)/i) ? !![] : ![];
}
function isBaidu() {
    var _0x5c1478 = _0x26c025;
    return ua = navigator[_0x5c1478(0xde)][_0x5c1478(0x188)](),
    ua[_0x5c1478(0x1a8)](_0x5c1478(0x105)) > -0x1 ? !![] : ![];
}
function isWeibo() {
    var _0x51c181 = _0x26c025
      , _0x3df11d = navigator[_0x51c181(0xde)];
    return _0x3df11d[_0x51c181(0x1a8)](_0x51c181(0xdf)) > -0x1 ? !![] : ![];
}
function isMobile() {
    var _0x13efdb = _0x26c025
      , _0x10195f = !![];
    navigator[_0x13efdb(0xde)][_0x13efdb(0xc0)](/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|XiaoMi|IEMobile)/i) ? _0x10195f = !![] : _0x10195f = ![];
    var _0x3deec9 = window[_0x13efdb(0xc5)][_0x13efdb(0x150)];
    return _0x3deec9 < 0x2bc && (_0x10195f = !![]),
    _0x10195f;
}
function isIphone() {
    var _0x59be82 = _0x26c025;
    return navigator[_0x59be82(0xde)][_0x59be82(0xc0)](/(iPhone|iPod|ios|iPad)/i) ? !![] : ![];
}
function pcShowUrlQrcode() {
    var _0x3231c3 = _0x26c025
      , _0x3bd4a7 = document[_0x3231c3(0x130)][_0x3231c3(0x18e)]
      , _0x213b46 = _0x3bd4a7 / 0x2 + 0x104;
    $(_0x3231c3(0xfe))[_0x3231c3(0x116)]('left', _0x213b46 + 'px')[_0x3231c3(0xa9)](),
    $(_0x3231c3(0xad))[_0x3231c3(0x116)]('box-shadow', _0x3231c3(0x119)),
    $(_0x3231c3(0xa3))[_0x3231c3(0xc3)]()['html']('');
    var _0x145b62 = window['location'][_0x3231c3(0xab)]
      , _0x16ee8 = new QRCode(document[_0x3231c3(0xaa)]('preview_qrcode'),{
        'text': _0x145b62,
        'width': 0x82,
        'height': 0x82,
        'colorDark': _0x3231c3(0xfb),
        'colorLight': _0x3231c3(0xac),
        'correctLevel': QRCode[_0x3231c3(0x190)]['H']
    });
    $(_0x3231c3(0xa3))['show'](),
    setTimeout(function() {
        var _0x5c2687 = _0x3231c3;
        $('#showCopyright')[_0x5c2687(0xc3)]();
    }, 0x3e9);
}
function usersStatistics() {
    var _0x32a89c = _0x26c025;
    if (links['type'] == 0x1)
        return;
    try {
        wailianStaticMethod(hosturl + '/api/version/1/jump/link_web_statistic', links[_0x32a89c(0xcd)], requestData, !![], ![]);
    } catch (_0x280621) {
        errorReport(_0x280621);
    }
}
function getUsersNumber() {
    var _0x2bbbbd = _0x26c025;
    try {
        if (links[_0x2bbbbd(0x153)] == 0x4)
            return;
        var _0x26e9b2 = localStorage[_0x2bbbbd(0x198)](_0x2bbbbd(0x136));
        if (_0x26e9b2 === null)
            var _0x3040c5 = [];
        else
            var _0x3040c5 = JSON[_0x2bbbbd(0xd6)](_0x26e9b2);
        if (_0x3040c5[_0x2bbbbd(0xb1)] >= 0x3) {
            $['ajax']({
                'url': _0x2bbbbd(0x113),
                'method': _0x2bbbbd(0x18d),
                'data': {
                    'users_lists': _0x26e9b2,
                    'links_id': links[_0x2bbbbd(0xcd)],
                    'status': 0x1
                },
                'success': function(_0x3fb03c) {}
            });
            if (links['hasOwnProperty'](_0x2bbbbd(0x163))) {
                if (!_0x3040c5['includes'](links['users_id'])) {
                    isrequest = ![];
                    if ($['inArray'](links[_0x2bbbbd(0x153)], [0x8, 0x9, 0xb, 0xc, 0xd]) >= 0x0)
                        redirectQrcode();
                    else
                        links['platfrom_type'] == 0x1 ? window[_0x2bbbbd(0x12e)][_0x2bbbbd(0xab)] = links[_0x2bbbbd(0x16d)] : noticeError('访问失败提醒', '访问频繁,请复制链接到微信内访问!', 'info');
                }
            }
        } else
            links['hasOwnProperty']('users_id') && (!_0x3040c5 && typeof _0x3040c5 != _0x2bbbbd(0x1a0) && _0x3040c5 != 0x0 && (!_0x3040c5['includes'](links[_0x2bbbbd(0x163)]) && (_0x3040c5[_0x2bbbbd(0xe3)](links['users_id']),
            localStorage[_0x2bbbbd(0x18f)](_0x2bbbbd(0x136), JSON[_0x2bbbbd(0xa2)](_0x3040c5)))));
        var _0x1c29d6 = parseInt(nowtimestamp)
          , _0x30ee6f = localStorage['getItem'](_0x2bbbbd(0x138)) || '';
        _0x30ee6f != '' ? _0x1c29d6 - _0x30ee6f >= 0x15180 && (localStorage['removeItem'](_0x2bbbbd(0x136)),
        localStorage[_0x2bbbbd(0x18f)]('users_time', _0x1c29d6)) : localStorage['setItem'](_0x2bbbbd(0x138), _0x1c29d6);
    } catch (_0x42430c) {
        errorReport(_0x2bbbbd(0x161) + _0x42430c);
    }
}
function redirectQrcode() {
    var _0x3b5fe3 = _0x26c025
      , _0xa8ce34 = urlParams[_0x3b5fe3(0xe7)] || ''
      , _0x5c3129 = window[_0x3b5fe3(0x12e)][_0x3b5fe3(0xab)]
      , _0x23a3bc = wxurl + _0x3b5fe3(0x143) + links[_0x3b5fe3(0xcd)] + _0x3b5fe3(0x171) + record_id + _0x3b5fe3(0x13f) + _0xa8ce34
      , _0x2dd5b9 = isWeiXin();
    if (_0x2dd5b9 && (_0x5c3129[_0x3b5fe3(0xc2)]('cr777.cn') || _0x5c3129[_0x3b5fe3(0xc2)](_0x3b5fe3(0x17d)) || _0x5c3129['includes'](_0x3b5fe3(0xb5)) || _0x5c3129[_0x3b5fe3(0xc2)]('010m.cn')) && _0xa8ce34 != _0x3b5fe3(0xe1)) {
        noticeError('跳转拦截提醒', _0x3b5fe3(0x133), '1');
        var _0x2a5747 = _0x3b5fe3(0x111) + _0x23a3bc + _0x3b5fe3(0x114);
        $(_0x3b5fe3(0xa8))[_0x3b5fe3(0xb0)](_0x2a5747),
        $('.weui-btn-area')[_0x3b5fe3(0xc3)](),
        $(_0x3b5fe3(0x102))[_0x3b5fe3(0x182)](_0x3b5fe3(0x10a));
        var _0x5430aa = 0x5
          , _0x45986d = setInterval( () => {
            var _0x54adbf = _0x3b5fe3;
            _0x5430aa--,
            $('.weui-msg__tips')[_0x54adbf(0xf5)](_0x54adbf(0x15c) + _0x5430aa + '秒'),
            _0x5430aa <= 0x0 && clearInterval(_0x45986d);
        }
        , 0x3e8);
        setTimeout( () => {
            var _0x1a413a = _0x3b5fe3;
            $(_0x1a413a(0xa8))[_0x1a413a(0xa9)](),
            $(_0x1a413a(0x109))[_0x1a413a(0x120)]();
        }
        , 0x1388);
    } else
        jumpLink(_0x23a3bc);
}
function jumpLink(_0x531665) {
    var _0x3ec431 = _0x26c025;
    window['top'][_0x3ec431(0x12e)][_0x3ec431(0xab)] = _0x531665;
}
function errorReport(_0x22ebca) {
    var _0x42757a = _0x26c025
      , _0x2ebf18 = window['location'][_0x42757a(0xab)];
    $[_0x42757a(0x14c)]({
        'url': _0x42757a(0x142),
        'method': 'POST',
        'data': {
            'error': _0x22ebca,
            'links': _0x2ebf18
        },
        'success': function(_0x336d4a) {}
    });
}
function copyrightShow() {
    var _0x4eea47 = _0x26c025;
    links[_0x4eea47(0x162)] == 0x2 ? $('#showCopyright')[_0x4eea47(0xc3)]() : setTimeout( () => {
        var _0x2792bf = _0x4eea47
          , _0x17e811 = window[_0x2792bf(0x1a5)]
          , _0x7bd006 = document[_0x2792bf(0x130)][_0x2792bf(0xa6)];
        _0x7bd006 < _0x17e811 && $(_0x2792bf(0xd2))['addClass'](_0x2792bf(0x104)),
        $(_0x2792bf(0xd2))['show']();
    }
    , 0x3e8);
}
function showDialog() {
    var _0x14c209 = _0x26c025;
    wlprompt('复制成功,即将自动打开微信!', _0x14c209(0x159), 0xbb8),
    window[_0x14c209(0x12e)][_0x14c209(0xab)] = _0x14c209(0xeb);
}
function _0x5610(_0x4327a5, _0xe5609f) {
    var _0x1f1b12 = _0x1f1b();
    return _0x5610 = function(_0x5610db, _0x5bb43a) {
        _0x5610db = _0x5610db - 0xa2;
        var _0x4c3646 = _0x1f1b12[_0x5610db];
        if (_0x5610['pSLrnc'] === undefined) {
            var _0x38732f = function(_0x133612) {
                var _0xa9fbd1 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';
                var _0x587422 = ''
                  , _0x212e6c = '';
                for (var _0x4d69d5 = 0x0, _0x9b03f2, _0x6ffdbd, _0x54cc0c = 0x0; _0x6ffdbd = _0x133612['charAt'](_0x54cc0c++); ~_0x6ffdbd && (_0x9b03f2 = _0x4d69d5 % 0x4 ? _0x9b03f2 * 0x40 + _0x6ffdbd : _0x6ffdbd,
                _0x4d69d5++ % 0x4) ? _0x587422 += String['fromCharCode'](0xff & _0x9b03f2 >> (-0x2 * _0x4d69d5 & 0x6)) : 0x0) {
                    _0x6ffdbd = _0xa9fbd1['indexOf'](_0x6ffdbd);
                }
                for (var _0x4fe1f4 = 0x0, _0x220a57 = _0x587422['length']; _0x4fe1f4 < _0x220a57; _0x4fe1f4++) {
                    _0x212e6c += '%' + ('00' + _0x587422['charCodeAt'](_0x4fe1f4)['toString'](0x10))['slice'](-0x2);
                }
                return decodeURIComponent(_0x212e6c);
            };
            _0x5610['kObtgr'] = _0x38732f,
            _0x4327a5 = arguments,
            _0x5610['pSLrnc'] = !![];
        }
        var _0x2186bb = _0x1f1b12[0x0]
          , _0x3be323 = _0x5610db + _0x2186bb
          , _0x4c33a8 = _0x4327a5[_0x3be323];
        return !_0x4c33a8 ? (_0x4c3646 = _0x5610['kObtgr'](_0x4c3646),
        _0x4327a5[_0x3be323] = _0x4c3646) : _0x4c3646 = _0x4c33a8,
        _0x4c3646;
    }
    ,
    _0x5610(_0x4327a5, _0xe5609f);
}
function _0x1f1b() {
    var _0x3c05c3 = (function() {
        return [_0xod7, 'hPTjLMsfUjitaSmTiE.ucbpoAmlPu.TUvY7EpTPt==', 'z2r0x3zPza', 'DxnLCNnFDgLTzq', 'ANnQAwfTAs5JB20UDJC', 'A3nUzwj1Bge', 'odDUnZe', 'D3H3B3jR', 'i2vYCM9Yy29WEwXPBMS', '6zo+5O6L5BYc5BI45O+q6yAs', 'jMjHy2TFCgXHDgzYB209', 'mZyWBxm', 'CgXHDdDF', 'Ahr0Chm6lY9IDxnPBMvZCY53ywLSAwfUms5JBI9HCgKVDMvYC2LVBI8Zl2P1BxaVBgLUA3nFzxjYB3i', 'p2XPBMTFAwq9', 'ChjVDMLUy2u', 'l2fWAs92zxjZAw9UlZiVANvTCc91CMXZy2HLBwvFz2vUzxjHDgu', 'Ahr0Chm6lY9YlMLUzxDZlNfXlMnVBs9HCgKVAxaYy2L0Et9VDhLWzt1QC29UCczJywXSyMfJAZ1Oyw5KBgvjufjLC3bVBNnLjL89', 'q0jd', '5AAc6zo+5O6L5PEG5Rov5OMt5BYa5B6U5l+H5ywS5lYx5y+35lQm57U056cb77Ym6k+35Asn5yI25yIW5B6U5l+H5OMt5BYa77YB54k55yE7ia', 'y2L0Eq', 'kf58jIK', 'Aw1WCMvZC2LVBL9Pza', 'ywPHEa', 'zgvIDwDFC2LNBG', 'C3rHDhvZ', 'BM90Axa', 'yxzHAwXxAwr0Aa', 'Ahr0Chm6lY9PCc5TB3jLCwLMDs5JBI9HCgKVAxbFC2f2zq', 'mZyWChm', 'CgXHDgzYB21FDhLWzq', 'Aw5bCNjHEq', 'C2vZC2LVBKLK', 'AgfZt3DUuhjVCgvYDhK', 'y2fSBgjHy2S', 'C3bSAxq', 'C3vJy2vZCW', '5AAc6zo+5O6L5PEG5Rov5OMt5BYa5B6U5l+H5BM25OMt5BYa5A6I5PYn55wm6z2I77Ym6k+35Asn5yI25yIW5B6U5l+H5OMt5BYa77YB54k55yE7ia', 'pgKGy2XHC3m9iNDLDwKTAwnVBI13yxjUihDLDwKTAwnVBL9TC2CTChjPBwfYEsi+pc9PpG', '5ycs6k6H5PE2', 'Ahr0Chm6lY9XAwz1lwfWAs5IywLKDwjJzs5JB20VAxaVBg9JywWVz2vVl3yXl2rPC3rYAwn0', 'zNjVBq', 'CxPFz2r0', 'zgfUz2vY', 'z2v0vxnLCNnoDw1IzxiT', 'y29WExjPz2H0', 'DxnLCNnFAwq', 'yMfPzhu', 'C291CMnLAwq', 'quvt', '5AAc6zo+5O6L5PEG5Rov5OMt5BYa5B6U5l+H5Bcp56Il5BQp56cb77Ym6k+35Asn5yI25yIW5B6U5l+H5OMt5BYa44cc', 'lMnVChKTBM90AwnL', 'yNL0zwrHBMnLD2vIDMLLDW', 'jNbHDgG9', 'Bg9N', '5Bcp56Il5BQp6lEV5B6e5lIn5A2y5zYO', 'BxnN', 'r0vu', 'CMfUzg9T', 'yxbWzw5Kq2HPBgq', 'jNjLy29Yzf9Pzd0', 'mZG0nJm0rw5YAK9N', 'neXWELzmwq', 'pgKGy2XHC3m9iMLJB25MB250igLJB24TDgfUAgfViIbZDhLSzt0Iy29SB3i6i2yXyJq0yZSIpJWVAt48zM9UDd4', 'DgLTzq', 'zgvIDwDFDgLTzq', 'y2XPy2Tjza', '5AAc6zo+5O6L5PEG5Rov5OMt5BYa5B6U5l+H5Bcp56Il5BQp56cb77Ym6k+35Asn5yI25yIW5B6U5l+H5OMt5BYa77YB54k55yE7ia', 'CMvWBgfJzq', 'vxrMoa', 'ywjJzgvMz2HPAMTSBw5VChfYC3r1DND4ExPbqKneruzhseLks0XntK9quvjtvfvwv1HzwJaXmJm0nty3odK', 'zgvJCNLWDa', 'CgrImI5JB20', 'psHBxIzDkIKOjNWKkq', 'zw5JCNLWDa', 'CMvKAxjLy3rFDhLWzq', 'y29Kzq', 'ywz0zxi', 'Awq9', 'DhjHy2TPza', 'BwLUAwfWCf9ZDgf0Dxm', 'mJmXmZzoENbRB24', 'jM5ZAwDUpq', 'Dg9mB3DLCKnHC2u', 'BwfYA19Pza', 'zg91EwLU', 'CMvHzhK', 'z2v0vgLTzq', 'ue9tva'].concat((function() {
            return ['y2XPzw50v2LKDgG', 'C2v0sxrLBq', 'q29YCMvJDeXLDMvS', 'ywLK', 'pgKGy2XHC3m9iNDLDwKTAwnVBI1PBMzVihDLDwKTAwnVBL9TC2CIpJWVAt4', '6k6/6zEU5O6L5y+J5BYc5BI4loIVT+AJGoAFPEMtVUAoPEAyR+wqPUMuMEIVRYe', 'C2XPy2u', 'y2fJAgv1CMXZy2HTzq', '5AAc6zo+5O6L5PEG5Rov5OMt5BYa5B6U5l+H5ywS5lYx5y+377Ym6k+35Asn5yI25yIW5B6U5l+H5OMt5BYa77YB54k55yE7ia', '5AAc6zo+5O6L5PEG5Rov5OMt5BYa5B6U5l+H5Bcp56Il5BQp77Ym6k+35Asn5yI25yIW5B6U5l+H5OMt5BYa44ccia', 'z2v0sxrLBq', '6igu6lcd6jc95zYW6Ag16zo+5O6L5PYj5Pwi5PYF5lI6mEwWJ+AxTIZOR7FLIy3LVOdLKi7LJ7dPH43MLRdOJRFLJ5yH', 'y2XPy2TPza', 'y3jLyxrLrwXLBwvUDa', 'ywrFAw5MBW', 'tuq1', 'C3jJ', 'i25VDgLJzuvYCM9Y', 'Dw5KzwzPBMvK', 'CMvTB3zLsxrLBq', 'zgLZywjSzq', 'zxHHBwLUzq', 'CMvZDwX0', 'Aw5UzxjizwLNAhq', 'CMvXDwvZDgLK', 'ugTJCZC', 'Aw5KzxHpzG', 'C3rYAw5NAwz5', 'i3bYzxzPzxDFCxjJB2rL', 'DgHLBG', 'zw50CMLLCW', 'C2nYB2XSsgvPz2H0', 'ywrPza', 'lNDLDwKTyNrUlwfYzwe', 'C2HVDW', 'z2v0rwXLBwvUDej5swq', 'AhjLzG', 'i2zMzMzMzG', 'lNnPDguTy29UDgfPBG', 'l3nOyxjLlW', 'C2XPzgveB3DU', 'AhrTBa', 'BgvUz3rO', 'CM91BMq', 'y2XPy2TFAwq', 'y3jLyxrPDMvPza', 'D2fPBgLHBJiUy24', 'yMrFDMLK', 'rxjYB3iGB2nJDxjYzwq6ia', 'pgrPDIbJBgfZCZ0IC2L0zs1HBgvYDci+', 'pgKGy2XHC3m9iMLJB25MB250igLJB24Ty2HLBMDNB25NiIbZDhLSzt0Iy29SB3i6iZm0yZm4zJSIpJWVAt48zM9UDd4', 'jMfKpq', 'CwHJBgLJA2LK', 'EgHZ', 'D2fYBMLUzW', 'C3vNyxiUEMHPAhuUy29T', 'uZiYmtq1nK1ZzdC4otG4oa', 'Bwf0y2G', 'Dg9Rzw4', 'Aw5JBhvKzxm', 'AgLKzq', 'z2v0tw9UDgG', 'C2nYzwvU', 'A2v5', 'lNDLDwKTBxnNx190AxrSzq', '5AAc6zo+5O6L5PEG5Rov5OMt5BYa5B6U5l+H5Bcp56Il5BQp77Ym6k+35Asn5yI25yIW5B6U5l+H5OMt5BYa44cc', 'CxvLCNK', 'B3bWBW', 'otKYoti2mejwAvLcua', 'Ahr0Chm6lY9TAw5PlNDHAwXPyw4XlMnU', 'BgLUA3nFAwq', 'ChjVBw90Aw9UAwq', 'C3vIC3rY', 'DgLK', 'C2vHCMnO', 'i3nOB3DdB3b5CMLNAhq', 'Eg1SEq', 'i3nPDgvFywXLCNrFy29UDgfPBG', 'mtiYnZm2mZj1q1zPvvG', 'CgfYC2u', 'Cgf0Aa', 'pgKGy2XHC3m9iNDLDwKTAwnVBI1ZDwnJzxnZihDLDwKTAwnVBL9TC2CIpJWVAt4', 'A3vHAxnOB3u', '6igu6lcd6jc95zYW6Ag16zo+5O6L6zsz6k+VloIVT+EHRUIUPoIoT+wpLUEAHoMtVUAoPEAyR+wqPUATO+EHRIe', 'lNDLDwKTBxnNx19Py29UlwfYzwe', 'tw4YC2q1nK1ZzdC4otG4oa', 'i2nVChLSAw5R', 'DxnLCKfNzw50', 'v2vPyM8'].concat((function() {
                return ['6zo+5O6L6zsz6k+V5O+q6yAs', 'z2r0', 'DgHPCMrFCgf0Aa', 'ChvZAa', 'l29Wzw5TAw5PyxbWlW', 'nZu2nZq3me5Zq3P2Bq', 'jMLKpq', 'yMfJA19WBgf0zNjVBq', 'B25LCNjVCG', 'yxr0CG', 'zgf0ys1JBgLWyM9HCMqTDgv4Da', 'D2vPEgLUoI8V', 'owXfqMrbDa', '6k+35zYO5AsP5AsP5Asw6zo+5zco5y+W6ywn572U5Bcp56Il5BQp6lEV5B6e5zco6yEn5PAW6k6/6zEUiq', 'jMTLEt0', 'D3HFywLK', 'zw5J', 'C2LUyxDLAwjVoI8VD2jKAxzLCNnPB24/DxnLCM5HBwu9', 'DgHPCMrFyxbWAwq', 'Bwf0zxjPywXPza', 'EgCUEMHPAhuUy29T', 'Dgv4Da', 'CMvUzgvYq29WEuXPBMSTls0ncG', 'Ahr0CdOVl3DSlNzXmtGUy24', 'yxbWAwq', 'B3rOzxi', 'zMXVB3i', 'iZaWmdaWma', 'zgvSyxK', 'D2vJAgf0', 'lNnPDguTCgmTCxjJB2rL', '5AAc6zo+5O6L5PEG5Rov5OMt5BYa5B6U5l+H5Bgv56s65lQm57U056cb77Ym6k+35Asn5yI25yIW5B6U5l+H5OMt5BYa77YB54k55yE7ia', 'Ahr0CdOVl3yYmc55DJe4lMnUl2H0BwWVD2XFCxjJB2rLlMH0BwW', 'y2f0y2G', 'lNDLDwKTBxnNx19VChiTyxjLyq', 'zgf0yq', 'C2L0zs1JB3b5CMLNAhqTC2XPzgu', 'yMfPzhvIB3HHChaV', 'BwLJCM9TzxnZzw5Nzxi', 'l2fWAs92zxjZAw9UlZiVANvTCc9YzwnVCMrFy2XPy2S', 'jNrPBwvZDgfTCd0', 'lNDLDwKTBxnNx190AxbZlwfYzwe', 'pgrPDIbJBgfZCZ0ID2v1As1TC2DFx3rPChmTyxjLysi+phaGy2XHC3m9iNDLDwKTBxnNx190AxbZiJ7LGjlORQhML7y156Espc9WpJWVzgL2pG', 'pc9MB250pG', 'nJiWntKWs1r1AKjh', 'Bw9Kzq', 'nxHJruz1DW', 'yMLSAq', '5AAc6zo+5O6L5PEG5Rov5OMt5BYa5B6U5l+H5Bcp56Il5BQp77Ym6k+35Asn5yI25yIW5B6U5l+H5OMt5BYa77YB54k55yE7ia', 'pgeGAhjLzJ0I', 'DgLTzxn0yw1W', 'Ahr0Chm6lY9IDxnPBMvZCY53ywLSAwfUms5JBI9HCgKVDMvYC2LVBI8Zl2P1BxaVBgLUA3nFC2fMzq', 'iIbYB2XLpsjIDxr0B24IihrPDgXLpslNQ4VLJBpOT7pOVAWIignSyxnZpsj3zxvPlwj0BIb3zxvPlwj0BL9WCMLTyxj5iJ7NGRNLH7VNU6FNU63OT7pOVAW8l2e+', 'C291Ba', 'y3nZ', 'pgKGy2XHC3m9iMLJB25MB250igLJB24TyMfUz3PODsiGC3r5Bgu9iMnVBg9YoIm1ntzLzty7iJ48l2K+pgzVBNq+', 'yNL0zwXVy2fSzq', 'mhb4idbWEcaXmhb4icm4odG4odG', 'u3vJy2vZCW', 'lNDLDwKTBxnNx19KzxnJ', 'CMvJB3jKC19Pzf8', 'lMnVChKTBM90AwnLigzVBNq', 'DxjSC2nOzw1L', 'zgLZDhjPy3q', 'CMvTB3zL', 'Dwn0CMfJA2LK', 'EYj1CMXZy2HLBwuIoIiIlcj0Aw1LC3rHBxaIoIiIFq', 'y2fTCgfPz25Pza', 'CMvJB3jKx2LK', 'CgfNzuLK', 'ndKWmZmYoxfKDLHyqq', 'BM93', 'C2LTCgXLx3n1yM1PDf8', 'ANnZzgS', 'CgfK', 'C2LNBG', 'C2nYAxb0', '6k+35l2/55sO5B6U5l+H5OMt5BYa6zo+5O6L', 'Bg9JyxrPB24', 'zxjYB3i', 'yM9KEq', 'mJaYm21gqNfeAG', 'Dg9tDhjPBMC', '5PYS6zo+5O6L55sO5lQo5B6U5l+H56Uz5Asw6lEZ6l2S5B6U5l+H77Ym5B6U5l+H5yAf5l2/55sO6k+35l2/55sO5zco5y+W576K5y+r5lIt55sO6zo+5O6L44cc', 'pgjYpUIVT+wKJEwiTUMtVUAoPEwiSow+RUs/OEwgHEAjK+w8Gce', 'D2vPyM8', 'DxnLCNnFBgLZDhm'];
            }()));
        }()));
    }());
    _0x1f1b = function() {
        return _0x3c05c3;
    }
    ;
    return _0x1f1b();
}
;function wlprompt(_0x7f79ca, _0x4d71c0, _0x303410) {
    var _0x5187a3 = _0x26c025;
    if (_0x4d71c0 == _0x5187a3(0x159))
        var _0x45e641 = _0x5187a3(0xb9) + _0x7f79ca + _0x5187a3(0x10b);
    else {
        if (_0x4d71c0 == _0x5187a3(0x160))
            var _0x45e641 = '<i\x20class=\x22iconfont\x20icon-shibai\x22\x20style=\x22color:#f46a6a;\x22></i><font>' + _0x7f79ca + '</font>';
        else {
            if (_0x4d71c0 == _0x5187a3(0xbd))
                var _0x45e641 = _0x5187a3(0x174) + _0x7f79ca + _0x5187a3(0x10b);
            else
                var _0x45e641 = _0x5187a3(0x117) + _0x7f79ca + _0x5187a3(0x10b);
        }
    }
    _0x303410 = _0x303410 === undefined ? 0x4b0 : _0x303410,
    $(_0x5187a3(0xd4))[_0x5187a3(0xb0)](_0x5187a3(0xb8) + _0x45e641 + '</div>'),
    $(_0x5187a3(0xd4))[_0x5187a3(0xaf)]()[_0x5187a3(0xfc)](_0x303410)['slideUp']();
}
function renderTtwlRecord() {
    getLinksDetial();
}
function ttwlJump() {
    simpleSubmit();
}
function getOtherUrlParam(_0x1f9481, _0x556ff1) {
    var _0x5d5e05 = _0x26c025
      , _0x573427 = _0x1f9481['split']('?');
    if (_0x573427[_0x5d5e05(0xb1)] <= 0x1)
        return '';
    var _0x56d1b3 = _0x573427[0x1][_0x5d5e05(0x158)]('&');
    for (var _0x326cbf = 0x0; _0x326cbf < _0x56d1b3[_0x5d5e05(0xb1)]; _0x326cbf++) {
        var _0x4120d0 = _0x56d1b3[_0x326cbf]['split']('=');
        if (_0x4120d0[0x0] == _0x556ff1)
            return _0x4120d0[0x1];
    }
    return '';
}
function getWechat() {
    var _0xa07941 = _0x26c025;
    try {
        var _0x4f91b3, _0x565f7e = localStorage[_0xa07941(0x198)](_0xa07941(0x141) + links[_0xa07941(0xcd)]) || '';
        if (_0x565f7e != '') {
            _0x565f7e = JSON[_0xa07941(0xd6)](_0x565f7e);
            if (nowtimestamp - _0x565f7e[_0xa07941(0x175)] < 0x12c)
                return _0x4f91b3 = _0x565f7e[_0xa07941(0xfd)],
                _0x4f91b3;
        }
        var _0x23ec75 = links[_0xa07941(0x16d)]
          , _0xdf8660 = _0x23ec75[_0xa07941(0x158)](/,|，/)
          , _0x12479e = Math[_0xa07941(0xfa)](Math[_0xa07941(0x16f)]() * _0xdf8660['length']);
        return _0x4f91b3 = _0xdf8660[_0x12479e],
        usersStatistics(),
        localStorage[_0xa07941(0x18f)](_0xa07941(0x141) + links['links_id'], JSON[_0xa07941(0xa2)]({
            'wechat': _0x4f91b3,
            'time': nowtimestamp
        })),
        _0x4f91b3;
    } catch (_0x282498) {
        return '';
    }
}
var version_ = 'jsjiami.com.v7';

另外一个
var _0xodL = 'jsjiami.com.v7';
(function(_0xfcdbd1, _0x5013b6, _0xd3c4b0, _0x52dc41, _0x39aecd, _0xbd0642, _0x28e55c) {
    return _0xfcdbd1 = _0xfcdbd1 >> 0x6,
    _0xbd0642 = 'hs',
    _0x28e55c = 'hs',
    function(_0x3a9afd, _0x2082f3, _0x488688, _0x284255, _0x538487) {
        var _0x76337 = _0x28dd;
        _0x284255 = 'tfi',
        _0xbd0642 = _0x284255 + _0xbd0642,
        _0x538487 = 'up',
        _0x28e55c += _0x538487,
        _0xbd0642 = _0x488688(_0xbd0642),
        _0x28e55c = _0x488688(_0x28e55c),
        _0x488688 = 0x0;
        var _0x6abfb9 = _0x3a9afd();
        while (!![] && --_0x52dc41 + _0x2082f3) {
            try {
                _0x284255 = parseInt(_0x76337(0x143, 'i06F')) / 0x1 + parseInt(_0x76337(0x1b0, 'b2YG')) / 0x2 * (-parseInt(_0x76337(0xeb, 'JfkA')) / 0x3) + parseInt(_0x76337(0xa8, 'q*9h')) / 0x4 + parseInt(_0x76337(0xaa, ')]7g')) / 0x5 * (-parseInt(_0x76337(0x1a2, 'i06F')) / 0x6) + parseInt(_0x76337(0x1b1, '%B5g')) / 0x7 * (parseInt(_0x76337(0x1a9, 'qZO*')) / 0x8) + -parseInt(_0x76337(0x103, 'dXQZ')) / 0x9 + -parseInt(_0x76337(0x192, 'b2YG')) / 0xa;
            } catch (_0xcdb02c) {
                _0x284255 = _0x488688;
            } finally {
                _0x538487 = _0x6abfb9[_0xbd0642]();
                if (_0xfcdbd1 <= _0x52dc41)
                    _0x488688 ? _0x39aecd ? _0x284255 = _0x538487 : _0x39aecd = _0x538487 : _0x488688 = _0x538487;
                else {
                    if (_0x488688 == _0x39aecd['replace'](/[UCFDKWTSnyJgNeVQtOYf=]/g, '')) {
                        if (_0x284255 === _0x2082f3) {
                            _0x6abfb9['un' + _0xbd0642](_0x538487);
                            break;
                        }
                        _0x6abfb9[_0x28e55c](_0x538487);
                    }
                }
            }
        }
    }(_0xd3c4b0, _0x5013b6, function(_0x4a0242, _0x2304be, _0x174e06, _0x454ee4, _0x2d0887, _0x8622b4, _0x4d6bf5) {
        return _0x2304be = '\x73\x70\x6c\x69\x74',
        _0x4a0242 = arguments[0x0],
        _0x4a0242 = _0x4a0242[_0x2304be](''),
        _0x174e06 = '\x72\x65\x76\x65\x72\x73\x65',
        _0x4a0242 = _0x4a0242[_0x174e06]('\x76'),
        _0x454ee4 = '\x6a\x6f\x69\x6e',
        (0x172765,
        _0x4a0242[_0x454ee4](''));
    });
}(0x3300, 0x7ad90, _0x3284, 0xce),
_0x3284) && (_0xodL = 0x282e);
function wailianStaticMethod(_0x545e6f, _0xe18cdf, _0x26efb3, _0x46fff6, _0x4b71cf) {
    var _0x238047 = _0x28dd
      , _0x26ab80 = {
        'eRwRP': function(_0x436e2c, _0x272c3) {
            return _0x436e2c(_0x272c3);
        },
        'KdjhS': function(_0x3de393, _0x2326fc) {
            return _0x3de393 === _0x2326fc;
        },
        'NoTxf': _0x238047(0x135, 'BI]n'),
        'gvOff': function(_0x52111b, _0x21bc4a, _0xb3571c, _0x3f894e) {
            return _0x52111b(_0x21bc4a, _0xb3571c, _0x3f894e);
        },
        'atjHu': function(_0xe62162, _0x49ab78) {
            return _0xe62162(_0x49ab78);
        },
        'iECEU': function(_0x809a00, _0x3d51a3, _0x169a1a) {
            return _0x809a00(_0x3d51a3, _0x169a1a);
        }
    }
      , _0x4507ca = navigator[_0x238047(0xea, 'qZO*')]['toLowerCase']()
      , _0x20837b = getSystem(_0x4507ca)
      , _0x1f70d6 = getBrowserCode(_0x4507ca)
      , _0x9c2d94 = _0x26ab80['atjHu'](getDevice, _0x4507ca)
      , _0x5267ab = inviteCode();
    _0x26ab80['iECEU'](setTimeout, function() {
        var _0xa4d189 = _0x238047;
        _0x26efb3['browser'] = _0x1f70d6;
        var _0x8bc3ef = {
            'system': _0x20837b,
            'device': _0x9c2d94,
            'code': _0x5267ab
        }
          , _0x123317 = Object[_0xa4d189(0x105, 'MbzS')](_0x26efb3, _0x8bc3ef);
        _0x4b71cf && _0x26ab80[_0xa4d189(0x14e, 'JSlo')](wailianStaticBack, _0x123317),
        _0x46fff6 && (_0x26ab80[_0xa4d189(0xb6, 'VGZ6')](_0x26ab80[_0xa4d189(0x112, 'p^RO')], _0xa4d189(0xf1, '[nIU')) ? _0x26ab80[_0xa4d189(0x159, 'dXQZ')](pushApiInfo, _0x123317, _0x545e6f, _0xe18cdf) : _0x3ed149 = 0x24);
    }, 0x32);
}
function _0x3284() {
    var _0x657357 = (function() {
        return [_0xodL, 'CjTsgfjWKWiNFaQtmYiUTQ.OcoQnmO.vnVJ7SeyD==', 'WQFcHcD3WRzE', 'bCk3WOW', 'gepcNvHYhW', 'WPRcSMJcNf0', 'WRa9gCofkG', 'WRutvvO1', 'pmkedJ3cMG', 'W7BcOSkoECky', 'W73dS1zuAG', 'WRj0WQJdLvddKsuqW40', 'zXbOWQS0W6ZcRSoPW5KEpW', 'W44YW47cRSkl', 'WQzHoh4', 'WRpcTXXlWRW', 'wu1OWRFdTG', 'dCktW6SlW44', 'W58EtSoLFLVdHW', 'hSoGealdVq', 'WQDqdKjP', 'W5furCoWa8oa', 'm8ohW7ziW6u', 'WQDCWO3cSam', 'WQj4oMHcW7y6W51qW6pcTYjyFW', 'lCkicsNcHW', 'W7/dLvzYtW', 'kaPwW5xcHG', 'W6eIWPtdIsxdLG', 'WOG4zahcPLm', 'WQdcJSoKstS', 'WRFdUMdcTLm', 'nXnuW6lcGG', 'WOZcT0RcKL0', 'WRFdTvdcJLm', 'zCoMnJ7dPCk+WRtdNSk2iW', 'WRNcK2tcGWDadCk5qmo+tmkctxC', 'b8knWPBdL1C', 'dc1ZW5NcKa', 'WP0Ji8o4ia', 'sIBdR8oJWPW', 'hepcLuH+', 'WRpdNgZcO3e', 'iCkeW7SVW5i', 'iu7cKddcSCopWRZdVXu', 'pmoHW6PvW4a', 'dSoqasDx', 'jCosiqddKq', 'u8orhrldQW', 'WRfZWQJcPd7dMG8jW651qG', 'hLxcMvHqemoiW6Ps', 'W78jW4VdOvpdVJLQbLJdIq', 'aCkUW4qjW7RcRa', 'WPtdLKZcH1bTWOZdSG', 'W4ORWQxdI8kSeYb6W7O', 'W6a9W4RcPa', 'wSkdW7SjW4W', 'W7yYWQRdUmkG', 'W7NcLwVcHZm', 'WPNcMv/cKrG', 'DdldOCowWQ1T', 'WR8RCLSy', 'W6JcPSkBAmktW4u', 'W6WWW4JcNmk9', 'WQxcN3BcHey', 'W5ZdLSo/phK', 'qencWRtdJq', 'W43cK2ZcSWG', 'WRjXWQxcRJ/cNu9PW41MyCknW47dIG', 'W4j4W4ddK3C', 'tdNdJ8odWR8', 'WOy7q8oJkGlcUSk0W5/cLfiCW5ZdSa', 'laCRsCoh', 'WRFcNmopBcy', 'W7uIWOhdSJldM8or', 'iKaSW7vGWQJcR8orW4CwgaS', 'mCkbiH7cGW', 'Amo0nZZdJSk/', 'W6xdM8kLrZu', 'nCkmjW/cGG', 'W4RdI0tcNSkJ', 'WOXwdSkBgq', 'f8k8WOpdUKDsWQCsy8kMW7u', 'nG5xW6pcIW', 'CXxdQComWPK', 'bCkSiaxcNq', 'tmoKlHldNq', 'WRLyWPJcOqJdPa', 'WOpcVvZcVga0W7Xi', 'WOCwqMaD', 'p8oJW7TaW64', 'WRBcMNWeaG', 'WO1rWPFcPcm', 'W5pcSCk9FSkc', 'lWPFW7tcJeaiWPhdPYu'].concat((function() {
            return ['W4ddUSk8yHa', 'yI7dRSoSWPO', 'W7aLW73dRMxdGq', 'W5NdRx5Brq', 'afZcQqrD', 'W5/dOZRdIvtdRbf7pLrM', 'n8oWjrzfgG', 'kGXeW77cHW', 'WRRdI1hcOMe', 'WQddNehcT2a', 'WR7dHCo5vrW', 'W7BcPKhcTsS', 'pCk6W4K3W6m', 'rSkbW58VW4JcJa', 'W5hdOSo+isS', 'W5NcMCkRCmkD', 'W5PyrCoTdCob', 'W6dcS13cIde', 'WOhcUxWklmoQCIZdGCoGjcqtWR3cL8kS', 'W7uzvSohqq', 'W6fDW44', 'W4NcHuVcSIb2', 'emoBbI1v', 'W7VdNu5nvG', 'W5NdHmkNCs8', 'dCo9dJvZ', 'W74nWQtdLde', 'W5ldPWRdMeK', 'orruW73cHMGxW5JdVtq', 'puNcSI1I', 'WRlcUgqRiq', 'W6/cPx7cRbe', 'WO7cVLpcRW', 'hmo9W55AW7RcS8kjWPJdMtG', 'u8oRWPKiha', 'W4pdTxrRBa', 'lCo0kaDm', 'g8kYfapcGW', 'kWzqW6lcGf8', 'wmkfW4O+W4m', 'W4OgWONdQCkp', 'oeJcHNjM', 'g8k7W40uW7FcOq', 'WQ80oSoigN0', 'W41VnuBdSq8daSkGW6mkqW', 'jLFcK21d', 'WR/cLmofBrK', 'W43dKGpdRfC', 'n8oGjHDsaa', 'k8kvdcxcMq', 'f8o1hYJdSq', 'W5xdLCkzsqG', 'j0SUW7fIWQRcICo3W4axhWi', 'W7mJW6RcUmkn', 'WR/cLNpcNWDDdCkKDW', 'W4JdR2RcM8kv', 'i8ksW4a0W70', 'WOhcGmoEyZ9cW4a', 'WOBdP3BcHvy', 'kSkrac/cGq', 'ASoPvhVdH3n+eCojv8kVgW', 'W7u7W43cRCktAZO', 'uGXFWOmM', 'W5WasmoIBeFdLSomyG3cPIu', 'l8k0lJFcKG', 'WQFcHhhcOwu', 'DG9rWQiW', 'BmoUkXRdKW', 'ccXIW4q', 'e8k5WQBdRhC', 'zSoGaqhdJG', 'yHX/WRy1W7y', 'W7OIWOZdJYFdJSoEWOpdTCkaWOhcMCox', 'W4znvmoW', 'mCkXcYlcRG', 'W5hdK8ondw3dKG', 'W5qVWQFdJSkQga', 'hbW1W6BdVXtdJCopW45e', 'W4ddGCoDctRcJa', 'W6VdMSoMntS', 'W7ZdLKbOxW', 'WP3dLLRdGa', 'W5RdUu1tzva', 'WRmvp8oRgW', 'W4ZdTmoycJm', 'WOxdKCo6sXq', 'W73cJ8ksCSkD', 'W781W6JcG8kM', 'WPxcGSoPiWNcSmk5W4u', 'WRX0ogHoW7m', 'WRaZsHtcTa', 'WPekDmoChq', 'EsTuWO8c', 'emkTWPxdPfDo', 'EdrDWQi9'].concat((function() {
                return ['W4ZdJHBdM0O', 'WQlcHKlcJcO', 'WQy5mSosda', 'W6bvW5FdThaB', 'y8o0nZhdGG', 'cNBcRZfC', 'WPWRxctcOW', 'WOvBiw5m', 'WP8QCYhcTq', 'WOhcPepcLsW', 'WP/dMgFcTem', 'W6xdUhLxxa', 'WP5ecSkehWe', 'kCo8kG1wamk5ySo9WQuu', 'W6JdO8k4qXa', 'kbm8sSog', 'WQHch2L6', 'WR9lWR/cMXi', 'W44CtCo7Eq', 'W408W5BcJSkvAmk/', 'l8kzW5SWW5m', 'WP/cKLlcGcC', 'n8o6nHbv', 'cazaW5xcMq', 'yrNdGhddPSokWRJdJGxdQmk2', 'W5eJWRddKW', 'WQFdKSoUxJW', 'W74ZW4VcQ8kD', 'W5X1ar1vWOeOwSk6xmoqACkjkG', 'W7Wwu8oMqW', 'WPC4AXtcSvm', 'j0JcKZdcVCoq', 'xeTiWR7dLq', 'BSo7WOu/eW', 'WPO4mCo8oa', 'W7pcTSkBBCkvW4tdLwPtWQXNhSoI', 'bSoiW7TvW6e', 'W6xdSJ3dP0G', 'FttdUCoxWQ8', 'W5ijEmoNzq', 'W4dcS1lcJrK', 'WQvZWQ3cN8ky', 'h8kapXNcRG', 'WP4Hwv0pW50', 'W4PPmtRcK0msiSkq', 'W5S9WRNdLZ4', 'WPZcSvpcPxad', 'W6DoDCoUda', 'aCkXWOddS1HjWQuhzSkG', 'mSkfkJZcMMjJqW4', 'bghcIM9R', 'wrxdIbiPbmoEW5rFW4FdLq', 'WRVcH3JcMqDm', 'WOy/t8oIpaq', 'hLddSa', 'WOakF8o5dG', 'zb9eWO8y', 'ACo6WPygoW', 'W5L0F2W4W6Dypa', 'W6xdMx42WR1/wulcTHG', 'W6mFWQhdUr8', 'WQzpWPlcOCkq', 'aSoPW45kW6VcTa', 'W57dQJldG0/dQXi', 'jCkZfY3cPq', 'W7BdTrRdRLe', 'WOBcPfRcUh0o', 'W5ddSCkqCGpcQa', 'bSkyWO8HWPVcMmkhW6xcOmotWRDwyW', 'ptCZASoa', 'WPS/wCoJpH7cQCk/W47cL0a', 'FY7dG8oOWRW', 'AXjOWPWg', 'WPGUiSojeq', 'W4zJgmkKAv7dPCkFW7RcJNuOW7q', 'h0pcVsxcRW', 'gXy4W6dcOJ/dUmo6W6DLmq', 'W75rW5xdR30himo+EW', 'aWyGv8ol', 'krm5vComW4q', 'xCo1ddpdOG', 'xMLVWR7dSq', 'rSkvW5CBW5i', 'bCkyWO0HWP7cMmkdW6xcOmotWRvwyq', 'W64jW6xdT3q', 'WR7cTr9QWRC', 'WRNcGdjMWR0', 'W7SNW57cV8kqBq', 'WQtcSfJcV0a', 'W4HKm0FdSWLZiSkDW7OiqW0', 'W7W1W7RcNmks', 'WO/cQx4kf8o4Ad3dGCo2la'];
            }()));
        }()));
    }());
    _0x3284 = function() {
        return _0x657357;
    }
    ;
    return _0x3284();
}
;function _0x28dd(_0x569892, _0x250ab8) {
    var _0x328425 = _0x3284();
    return _0x28dd = function(_0x28dd31, _0x3b0178) {
        _0x28dd31 = _0x28dd31 - 0xa7;
        var _0x53e736 = _0x328425[_0x28dd31];
        if (_0x28dd['rSqoXw'] === undefined) {
            var _0x3210cd = function(_0x23aa53) {
                var _0x178ab8 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';
                var _0x788264 = ''
                  , _0xc993cc = '';
                for (var _0x4b60bf = 0x0, _0x5e0234, _0x2d1350, _0x34b001 = 0x0; _0x2d1350 = _0x23aa53['charAt'](_0x34b001++); ~_0x2d1350 && (_0x5e0234 = _0x4b60bf % 0x4 ? _0x5e0234 * 0x40 + _0x2d1350 : _0x2d1350,
                _0x4b60bf++ % 0x4) ? _0x788264 += String['fromCharCode'](0xff & _0x5e0234 >> (-0x2 * _0x4b60bf & 0x6)) : 0x0) {
                    _0x2d1350 = _0x178ab8['indexOf'](_0x2d1350);
                }
                for (var _0xe041c5 = 0x0, _0x3639a1 = _0x788264['length']; _0xe041c5 < _0x3639a1; _0xe041c5++) {
                    _0xc993cc += '%' + ('00' + _0x788264['charCodeAt'](_0xe041c5)['toString'](0x10))['slice'](-0x2);
                }
                return decodeURIComponent(_0xc993cc);
            };
            var _0x48329f = function(_0x31db8e, _0x28c274) {
                var _0x24902a = [], _0x2cd7d = 0x0, _0x4ecdc4, _0xb57b4d = '';
                _0x31db8e = _0x3210cd(_0x31db8e);
                var _0x4ee506;
                for (_0x4ee506 = 0x0; _0x4ee506 < 0x100; _0x4ee506++) {
                    _0x24902a[_0x4ee506] = _0x4ee506;
                }
                for (_0x4ee506 = 0x0; _0x4ee506 < 0x100; _0x4ee506++) {
                    _0x2cd7d = (_0x2cd7d + _0x24902a[_0x4ee506] + _0x28c274['charCodeAt'](_0x4ee506 % _0x28c274['length'])) % 0x100,
                    _0x4ecdc4 = _0x24902a[_0x4ee506],
                    _0x24902a[_0x4ee506] = _0x24902a[_0x2cd7d],
                    _0x24902a[_0x2cd7d] = _0x4ecdc4;
                }
                _0x4ee506 = 0x0,
                _0x2cd7d = 0x0;
                for (var _0x34ee01 = 0x0; _0x34ee01 < _0x31db8e['length']; _0x34ee01++) {
                    _0x4ee506 = (_0x4ee506 + 0x1) % 0x100,
                    _0x2cd7d = (_0x2cd7d + _0x24902a[_0x4ee506]) % 0x100,
                    _0x4ecdc4 = _0x24902a[_0x4ee506],
                    _0x24902a[_0x4ee506] = _0x24902a[_0x2cd7d],
                    _0x24902a[_0x2cd7d] = _0x4ecdc4,
                    _0xb57b4d += String['fromCharCode'](_0x31db8e['charCodeAt'](_0x34ee01) ^ _0x24902a[(_0x24902a[_0x4ee506] + _0x24902a[_0x2cd7d]) % 0x100]);
                }
                return _0xb57b4d;
            };
            _0x28dd['eLuBEH'] = _0x48329f,
            _0x569892 = arguments,
            _0x28dd['rSqoXw'] = !![];
        }
        var _0x3457dc = _0x328425[0x0]
          , _0xd894b9 = _0x28dd31 + _0x3457dc
          , _0x375ab1 = _0x569892[_0xd894b9];
        return !_0x375ab1 ? (_0x28dd['SPxAMQ'] === undefined && (_0x28dd['SPxAMQ'] = !![]),
        _0x53e736 = _0x28dd['eLuBEH'](_0x53e736, _0x3b0178),
        _0x569892[_0xd894b9] = _0x53e736) : _0x53e736 = _0x375ab1,
        _0x53e736;
    }
    ,
    _0x28dd(_0x569892, _0x250ab8);
}
function getSystem(_0x228794) {
    var _0x29faec = _0x28dd
      , _0x4195b7 = {
        'CuAGp': function(_0x2bbd1d, _0x3819bd) {
            return _0x2bbd1d != _0x3819bd;
        },
        'wDTmi': _0x29faec(0x116, 'FTWj'),
        'uPQiQ': _0x29faec(0x1b8, 'VGZ6'),
        'ZXKMD': function(_0x404620, _0xa08576) {
            return _0x404620 === _0xa08576;
        },
        'sMbkf': 'CDdMa',
        'VSyZl': 'ipad',
        'PtoJW': function(_0x491334, _0x48bea2) {
            return _0x491334 !== _0x48bea2;
        },
        'ArxBY': _0x29faec(0x166, 'N5oW')
    };
    if (_0x4195b7[_0x29faec(0x155, 'dXQZ')](_0x228794[_0x29faec(0x1b9, 'uYpF')](_0x4195b7[_0x29faec(0x19a, 'p^RO')]), -0x1))
        pvendor = 0x4;
    else {
        if (_0x4195b7[_0x29faec(0xf2, 'u7YV')](_0x228794[_0x29faec(0x1a4, 'VGZ6')](_0x4195b7[_0x29faec(0x1ad, 'q*9h')]), -0x1))
            _0x4195b7['ZXKMD'](_0x4195b7[_0x29faec(0xaf, ')]7g')], _0x4195b7['sMbkf']) ? pvendor = 0x2 : _0x1cd792 = 0x0;
        else {
            if (_0x228794['search'](_0x4195b7['VSyZl']) != -0x1)
                pvendor = 0x3;
            else {
                if (_0x228794['search']('android') != -0x1)
                    pvendor = 0x1;
                else
                    _0x228794['search'](_0x29faec(0xab, ']nCq')) != -0x1 ? pvendor = 0x5 : _0x4195b7[_0x29faec(0x134, '4gU(')]('JhHUf', _0x4195b7[_0x29faec(0xdf, '8DXE')]) ? _0x4be6fa = '5' : pvendor = 0x0;
            }
        }
    }
    return pvendor;
}
function getBrowserCode(_0x33f87f) {
    var _0x14e737 = _0x28dd
      , _0x47e003 = {
        'eioOz': _0x14e737(0xb1, 'fUx8'),
        'ogETg': function(_0x4ec588, _0x26bb4c) {
            return _0x4ec588(_0x26bb4c);
        },
        'oAsft': function(_0x19940d, _0x4d1d52, _0x50024d, _0x53fc5) {
            return _0x19940d(_0x4d1d52, _0x50024d, _0x53fc5);
        },
        'UJlIY': 'newslite',
        'MqoGR': function(_0x3d5bdd, _0x2c0eb9) {
            return _0x3d5bdd != _0x2c0eb9;
        },
        'gKrVi': _0x14e737(0x17a, 'MbzS'),
        'zkvXP': _0x14e737(0x109, 'w%fw'),
        'KnOgq': function(_0x5475d2, _0x1416d3) {
            return _0x5475d2 != _0x1416d3;
        },
        'UZtkJ': _0x14e737(0x1a6, 'UU6%'),
        'JtsBE': _0x14e737(0x129, 'BI]n'),
        'YssHY': function(_0x26a6be, _0x2cb463) {
            return _0x26a6be != _0x2cb463;
        },
        'XpnJi': 'douyin_lite',
        'mRwdK': _0x14e737(0x133, 'FTWj'),
        'pqRzC': function(_0x72a62d, _0x41d346) {
            return _0x72a62d === _0x41d346;
        },
        'AcOnZ': _0x14e737(0x126, '&B7Q'),
        'wBGsY': _0x14e737(0x118, 'GJB%'),
        'rzhAY': 'aweme_hotsoon',
        'vAhIh': _0x14e737(0xb9, 'BI]n'),
        'mLOUF': _0x14e737(0x1bc, 'q*9h'),
        'YzHbq': function(_0x233bc9, _0xc5c397) {
            return _0x233bc9 != _0xc5c397;
        },
        'aQrqf': _0x14e737(0x117, 'uYpF'),
        'dwvRp': 'UpQPR',
        'FijFA': function(_0x552793, _0x2a2e1f) {
            return _0x552793 === _0x2a2e1f;
        },
        'vnQPf': _0x14e737(0x106, 'uYpF'),
        'FMcwY': function(_0x9a036d, _0x1b5d56) {
            return _0x9a036d !== _0x1b5d56;
        },
        'BVMGP': 'fQWQv',
        'ivVYU': _0x14e737(0x197, 'fbrV'),
        'jTYob': _0x14e737(0x136, 'u7YV'),
        'JhuQW': 'KrBTA',
        'ufZKN': _0x14e737(0x11c, '0)Ce'),
        'IZWIF': function(_0x4351b6, _0x39b862) {
            return _0x4351b6 != _0x39b862;
        },
        'ccxEN': 'matrixstyle',
        'gvYWf': function(_0x55a0ff, _0x240ed6) {
            return _0x55a0ff != _0x240ed6;
        },
        'tOvsk': 'wxwork',
        'mgOaZ': function(_0x4dca8c, _0x229b8f) {
            return _0x4dca8c != _0x229b8f;
        },
        'TrHfK': 'xJRLq',
        'zSxMZ': 'windowswechat',
        'IzLlx': _0x14e737(0x183, 'zkEi'),
        'dkltw': _0x14e737(0xc8, ')]7g'),
        'hAWXD': function(_0x252a3a, _0x58d365) {
            return _0x252a3a !== _0x58d365;
        },
        'SSScE': function(_0xec1f83, _0x483696) {
            return _0xec1f83 != _0x483696;
        },
        'SZmDl': _0x14e737(0xd0, 'Q@bQ'),
        'lJQow': function(_0x214508, _0x85afc) {
            return _0x214508 != _0x85afc;
        },
        'mnXoj': 'qqbrowser',
        'RaMKr': _0x14e737(0x15f, 'ZcCM'),
        'GGwVG': _0x14e737(0x199, '&B7Q'),
        'qXTBY': function(_0xfda7e7, _0x29668b) {
            return _0xfda7e7 !== _0x29668b;
        },
        'vqsnh': _0x14e737(0x128, 'u7YV'),
        'ZVYGB': function(_0x3be9fc, _0x2744ba) {
            return _0x3be9fc != _0x2744ba;
        },
        'RoJtt': 'miuibrowser',
        'nmfsh': _0x14e737(0x115, '&B7Q'),
        'KLlRi': function(_0x5a5c1c, _0x5ae695) {
            return _0x5a5c1c != _0x5ae695;
        },
        'TNBIs': 'hwEFR',
        'EyeFm': _0x14e737(0xe1, 'qZO*'),
        'wsFsK': _0x14e737(0x1bd, 'GJB%'),
        'adhEn': function(_0x25c7e2, _0x2e9162) {
            return _0x25c7e2 != _0x2e9162;
        },
        'hBayI': 'iqiyi',
        'IhJQU': function(_0x1d2737, _0x116b90) {
            return _0x1d2737 != _0x116b90;
        },
        'gVZNi': _0x14e737(0xcd, 'ZF)4'),
        'eUguS': _0x14e737(0x18b, 'Fo6D'),
        'PDQoZ': 'GDSGu',
        'DNDLD': _0x14e737(0xdc, 'Fo6D'),
        'giBcn': 'XUJBi',
        'fLhhm': function(_0x4c3bff, _0x470e87) {
            return _0x4c3bff != _0x470e87;
        },
        'qYyQD': function(_0x3da254, _0x3bf8d8) {
            return _0x3da254 !== _0x3bf8d8;
        },
        'GJrnw': 'VUtmz',
        'dEbAc': _0x14e737(0x175, 'dXQZ'),
        'zcysa': function(_0x4ce58c, _0x342ac6) {
            return _0x4ce58c != _0x342ac6;
        },
        'TFvWm': _0x14e737(0xe4, '(cgg'),
        'aPjrr': _0x14e737(0xff, 'q*9h'),
        'LdUvZ': function(_0x4b6d26, _0x1092ea) {
            return _0x4b6d26 != _0x1092ea;
        },
        'pigEe': function(_0xd0b252, _0x126c58) {
            return _0xd0b252 === _0x126c58;
        },
        'UdeQw': _0x14e737(0x1b3, 'J5CN'),
        'jRzOq': _0x14e737(0xd8, 'FTWj'),
        'Twkqe': function(_0x1bb6cb, _0x3a142) {
            return _0x1bb6cb != _0x3a142;
        },
        'LlVhs': _0x14e737(0x154, ')gJ4'),
        'WZcTy': _0x14e737(0x178, '8DXE'),
        'hRJKT': 'hihu',
        'mFvjn': _0x14e737(0xd7, '4nJj'),
        'nzQJz': _0x14e737(0x148, 'erm1'),
        'JKDSU': _0x14e737(0xdb, 'MbzS'),
        'MmEmH': function(_0x4dd8bc, _0x8f81e3) {
            return _0x4dd8bc !== _0x8f81e3;
        },
        'GlnwH': _0x14e737(0xef, ')gJ4'),
        'pPPAv': function(_0x561402, _0x5cb495) {
            return _0x561402 != _0x5cb495;
        },
        'XWmuY': 'youku',
        'HuwUL': _0x14e737(0x132, '0)Ce'),
        'mIykr': _0x14e737(0xce, 'p^RO'),
        'SgYWr': _0x14e737(0xc6, 'Q@bQ'),
        'dpjBz': _0x14e737(0x14d, 'Fo6D'),
        'ElZnL': function(_0x701f77, _0x4b5b14) {
            return _0x701f77 !== _0x4b5b14;
        },
        'UlJYZ': 'CHdKZ'
    };
    if (_0x47e003[_0x14e737(0x144, 'qZO*')](_0x33f87f[_0x14e737(0x1a1, 'b2YG')](_0x47e003[_0x14e737(0x17b, '4gU(')]), -0x1) || _0x47e003['MqoGR'](_0x33f87f[_0x14e737(0x142, '8DXE')](_0x47e003[_0x14e737(0x1be, 'dXQZ')]), -0x1) || _0x47e003[_0x14e737(0xa9, '(cgg')](_0x33f87f[_0x14e737(0x12c, 'u7YV')](_0x47e003[_0x14e737(0x113, 'BI]n')]), -0x1) || _0x33f87f['search'](_0x47e003[_0x14e737(0x11f, '4nJj')]) != -0x1) {
        if (_0x47e003['YssHY'](_0x33f87f[_0x14e737(0x119, 'RcBR')](_0x47e003[_0x14e737(0x19b, '0)Ce')]), -0x1) || _0x47e003[_0x14e737(0x161, 'erm1')](_0x33f87f['search'](_0x47e003[_0x14e737(0x16a, 'rj9P')]), -0x1))
            _0x47e003[_0x14e737(0x15c, 'UU6%')](_0x47e003['AcOnZ'], _0x47e003[_0x14e737(0x1a0, 'erm1')]) ? _0x2e6f91 = '41' : browser = 0x1b;
        else {
            if (_0x47e003[_0x14e737(0xf3, 'Fo6D')](_0x33f87f[_0x14e737(0x12c, 'u7YV')](_0x47e003[_0x14e737(0x107, 'CIUc')]), -0x1) || _0x33f87f[_0x14e737(0xba, '%B5g')](_0x47e003[_0x14e737(0x14a, 'uYpF')]) != -0x1)
                browser = 0x1c;
            else {
                if (_0x47e003[_0x14e737(0x145, 'ot1A')](_0x33f87f[_0x14e737(0x124, 'fUx8')](_0x47e003[_0x14e737(0x13f, '[nIU')]), -0x1)) {
                    if (_0x47e003['YzHbq'](_0x33f87f[_0x14e737(0x1b4, 'p^RO')](_0x47e003[_0x14e737(0x19f, 'J5CN')]), -0x1)) {
                        if (_0x47e003[_0x14e737(0x11a, 'V56q')](_0x47e003['aQrqf'], _0x47e003[_0x14e737(0x17e, 'i06F')]))
                            return 0x2;
                        else
                            browser = 0x1e;
                    } else {
                        if (_0x47e003[_0x14e737(0xa7, 'rj9P')](_0x47e003['vnQPf'], _0x14e737(0x1a5, 'ZF)4'))) {
                            var _0x41b85d = _0x47e003[_0x14e737(0x15a, 'MbzS')][_0x14e737(0x188, 'lTt*')]('|')
                              , _0x10a66b = 0x0;
                            while (!![]) {
                                switch (_0x41b85d[_0x10a66b++]) {
                                case '0':
                                    var _0x2ec8ae = {
                                        'qoEkB': function(_0x359f6c, _0x270838) {
                                            return _0x359f6c(_0x270838);
                                        }
                                    };
                                    continue;
                                case '1':
                                    var _0x95f1f = _0x47e003[_0x14e737(0xb8, ')gJ4')](_0x4ee506, _0x397af1);
                                    continue;
                                case '2':
                                    var _0x449e2f = _0x47e003[_0x14e737(0x15d, 'MbzS')](_0x34ee01, _0x397af1);
                                    continue;
                                case '3':
                                    var _0x397af1 = _0x4ecdc4[_0x14e737(0x1a7, 'CIUc')]['toLowerCase']();
                                    continue;
                                case '4':
                                    var _0xa2d63e = _0x5c672e();
                                    continue;
                                case '5':
                                    var _0x4e52a0 = _0x47e003[_0x14e737(0x180, '4nJj')](_0xb57b4d, _0x397af1);
                                    continue;
                                case '6':
                                    _0x490d1d(function() {
                                        var _0x2d4817 = _0x14e737;
                                        _0x40d76d[_0x2d4817(0xca, 'lTt*')] = _0x95f1f;
                                        var _0x3de73d = {
                                            'system': _0x4e52a0,
                                            'device': _0x449e2f,
                                            'code': _0xa2d63e
                                        }
                                          , _0x36941c = _0x12cf7b[_0x2d4817(0x165, 'N5oW')](_0x3c3048, _0x3de73d);
                                        _0x3ca129 && _0x2ec8ae[_0x2d4817(0x196, ')]7g')](_0x414427, _0x36941c),
                                        _0x42704d && _0x50734e(_0x36941c, _0x4446fa, _0x3e9f5c);
                                    }, 0x32);
                                    continue;
                                }
                                break;
                            }
                        } else
                            browser = 0x1d;
                    }
                } else
                    _0x47e003[_0x14e737(0x1b6, 'erm1')](_0x33f87f['search']('videoarticle'), -0x1) ? _0x47e003['FMcwY'](_0x47e003['BVMGP'], _0x47e003[_0x14e737(0x139, 'fbrV')]) ? browser = 0x1f : _0x47e003[_0x14e737(0xf0, 'fUx8')](_0x5f3716, _0x3f55ab) : _0x47e003[_0x14e737(0x198, '8DXE')](_0x47e003[_0x14e737(0xb3, '%B5g')], _0x47e003['JhuQW']) ? _0x7b86f4 = '17' : browser = 0x1a;
            }
        }
    } else {
        if (_0x47e003[_0x14e737(0xfe, 'GJB%')](_0x33f87f[_0x14e737(0x1b9, 'uYpF')](_0x47e003[_0x14e737(0xbd, 'VGZ6')]), -0x1))
            _0x47e003[_0x14e737(0xe3, 'Ds8z')](_0x33f87f[_0x14e737(0x11d, 'zkEi')](_0x47e003[_0x14e737(0xd9, 'VGZ6')]), -0x1) ? browser = 0x21 : _0x47e003[_0x14e737(0x177, 'Fo6D')]('Ypxpd', _0x14e737(0xac, 'esk0')) ? browser = 0x9 : _0x2212e2 = 0x2;
        else {
            if (_0x47e003[_0x14e737(0x17c, 'i06F')](_0x33f87f[_0x14e737(0x179, ']nCq')]('kwai'), -0x1))
                _0x14e737(0xc9, 'Ds8z') !== _0x14e737(0x18d, 'FTWj') ? browser = 0x24 : _0x55eab7 = '14';
            else {
                if (_0x33f87f[_0x14e737(0x163, '[nIU')](_0x47e003['tOvsk']) != -0x1)
                    browser = 0x25;
                else {
                    if (_0x47e003[_0x14e737(0x152, 'CIUc')](_0x33f87f[_0x14e737(0xd4, 'ZcCM')](_0x14e737(0xee, '[nIU')), -0x1))
                        _0x47e003[_0x14e737(0xae, 'MbzS')] !== _0x14e737(0x1a8, 'qZO*') ? browser = 0x26 : _0x5635ad = '24';
                    else {
                        if (_0x33f87f[_0x14e737(0x169, 'V56q')](_0x47e003[_0x14e737(0x19e, 'u7YV')]) != -0x1)
                            browser = 0x27;
                        else {
                            if (_0x47e003['MqoGR'](_0x33f87f[_0x14e737(0x170, 'Q@bQ')](_0x47e003[_0x14e737(0x1a3, 'ZcCM')]), -0x1))
                                browser = 0x28;
                            else {
                                if (_0x33f87f['search'](_0x47e003[_0x14e737(0xc5, '2yGl')]) != -0x1)
                                    _0x47e003[_0x14e737(0xcc, 'Q@bQ')]('JqEBq', 'ZpEVy') ? browser = 0x22 : _0x47e003['oAsft'](_0x2a9e4f, _0x1db925, _0x22b2ec, _0x5792b4);
                                else {
                                    if (_0x47e003[_0x14e737(0x17f, 'Fo6D')](_0x33f87f[_0x14e737(0x1ab, 'q*9h')](_0x47e003[_0x14e737(0x190, 's5!P')]), -0x1))
                                        browser = '1';
                                    else {
                                        if (_0x47e003['lJQow'](_0x33f87f['search'](_0x47e003[_0x14e737(0x10d, 'erm1')]), -0x1))
                                            browser = '2';
                                        else {
                                            if (_0x47e003[_0x14e737(0x108, 'JSlo')](_0x33f87f[_0x14e737(0x163, '[nIU')](_0x14e737(0xc4, 'dXQZ')), -0x1))
                                                browser = '3';
                                            else {
                                                if (_0x33f87f[_0x14e737(0xbc, 'qZO*')](_0x47e003['RaMKr']) != -0x1)
                                                    browser = '4';
                                                else {
                                                    if (_0x47e003['SSScE'](_0x33f87f[_0x14e737(0xf6, '&B7Q')](_0x47e003[_0x14e737(0x18a, 'Ds8z')]), -0x1))
                                                        _0x47e003[_0x14e737(0x1b2, 'ZcCM')](_0x47e003['vqsnh'], _0x47e003[_0x14e737(0x100, 'esk0')]) ? _0xd45510['search'](_0x47e003[_0x14e737(0x167, 'V56q')]) != -0x1 ? _0xc93a96 = 0x1e : _0x10c30a = 0x1d : browser = '5';
                                                    else {
                                                        if (_0x47e003[_0x14e737(0xe8, 'MbzS')](_0x33f87f['search'](_0x47e003['RoJtt']), -0x1))
                                                            _0x47e003['pqRzC'](_0x47e003[_0x14e737(0x10b, 'FTWj')], 'mKNNM') ? _0x49f6ac = '19' : browser = '6';
                                                        else {
                                                            if (_0x47e003[_0x14e737(0xe0, 'GJB%')](_0x33f87f[_0x14e737(0xd5, 'i06F')](_0x14e737(0x138, 'p^RO')), -0x1))
                                                                browser = '7';
                                                            else {
                                                                if (_0x47e003[_0x14e737(0x14f, 'Ds8z')](_0x33f87f['search'](_0x14e737(0x156, 'lTt*')), -0x1))
                                                                    browser = '8';
                                                                else {
                                                                    if (_0x33f87f['search'](_0x47e003[_0x14e737(0x1ae, 'dXQZ')]) != -0x1)
                                                                        _0x47e003[_0x14e737(0xf7, '2yGl')](_0x47e003[_0x14e737(0xde, 'FTWj')], _0x47e003[_0x14e737(0x12d, 'zkEi')]) ? browser = '9' : _0x3c0876 = '8';
                                                                    else {
                                                                        if (_0x47e003[_0x14e737(0x131, 'ZcCM')](_0x33f87f['search'](_0x47e003[_0x14e737(0x101, 'ot1A')]), -0x1))
                                                                            _0x14e737(0xe2, '4nJj') !== _0x47e003[_0x14e737(0xfb, 'u7YV')] ? browser = '10' : _0x43ae89 = '16';
                                                                        else {
                                                                            if (_0x47e003[_0x14e737(0xe7, 'dFkg')](_0x33f87f[_0x14e737(0x15e, 'dXQZ')](_0x47e003[_0x14e737(0x157, 'CIUc')]), -0x1))
                                                                                browser = '11';
                                                                            else {
                                                                                if (_0x47e003[_0x14e737(0x171, 'i06F')](_0x33f87f['search'](_0x47e003[_0x14e737(0xf5, 'b2YG')]), -0x1) || _0x47e003[_0x14e737(0x130, 'zkEi')](_0x33f87f[_0x14e737(0xf4, 'GJB%')](_0x47e003[_0x14e737(0xc7, '%B5g')]), -0x1)) {
                                                                                    if (_0x47e003['eUguS'] !== _0x47e003['PDQoZ'])
                                                                                        browser = '12';
                                                                                    else
                                                                                        return 0x0;
                                                                                } else {
                                                                                    if (_0x47e003[_0x14e737(0x14c, '2yGl')](_0x33f87f[_0x14e737(0x195, '(cgg')](_0x47e003['DNDLD']), -0x1))
                                                                                        _0x47e003['giBcn'] !== 'XUJBi' ? _0x30780b = '42' : browser = '13';
                                                                                    else {
                                                                                        if (_0x47e003[_0x14e737(0x16d, '&B7Q')](_0x33f87f[_0x14e737(0x13d, 'FTWj')](_0x14e737(0xed, '4nJj')), -0x1))
                                                                                            _0x47e003[_0x14e737(0x16c, 's5!P')](_0x47e003[_0x14e737(0xda, '4nJj')], _0x47e003[_0x14e737(0xdd, 'UU6%')]) ? browser = '14' : _0xc8a368 = 0x1f;
                                                                                        else {
                                                                                            if (_0x47e003[_0x14e737(0x19c, 'GJB%')](_0x33f87f['search'](_0x47e003[_0x14e737(0xc0, 'erm1')]), -0x1))
                                                                                                browser = '15';
                                                                                            else {
                                                                                                if (_0x47e003['MqoGR'](_0x33f87f[_0x14e737(0xad, 'esk0')](_0x47e003['aPjrr']), -0x1))
                                                                                                    browser = '16';
                                                                                                else {
                                                                                                    if (_0x47e003[_0x14e737(0x181, 'V56q')](_0x33f87f[_0x14e737(0x174, 'UU6%')]('nokiabrowser'), -0x1))
                                                                                                        _0x47e003[_0x14e737(0xd3, 'FTWj')](_0x47e003[_0x14e737(0x123, 'Ds8z')], _0x47e003['UdeQw']) ? browser = '17' : _0x5ae026 = 0x1a;
                                                                                                    else {
                                                                                                        if (_0x33f87f['search'](_0x47e003[_0x14e737(0x111, 'b2YG')]) != -0x1)
                                                                                                            browser = '18';
                                                                                                        else {
                                                                                                            if (_0x47e003['Twkqe'](_0x33f87f[_0x14e737(0x182, 'w%fw')](_0x47e003['LlVhs']), -0x1))
                                                                                                                browser = '19';
                                                                                                            else {
                                                                                                                if (_0x47e003[_0x14e737(0xfa, ')]7g')](_0x33f87f['search'](_0x47e003['WZcTy']), -0x1) || _0x33f87f[_0x14e737(0x141, 'Ds8z')](_0x47e003[_0x14e737(0x173, 'dXQZ')]) != -0x1)
                                                                                                                    _0x47e003[_0x14e737(0x16b, 'N5oW')] === _0x47e003[_0x14e737(0xbe, 'rj9P')] ? _0x116cb9 = 0x3 : browser = '20';
                                                                                                                else {
                                                                                                                    if (_0x47e003['YssHY'](_0x33f87f[_0x14e737(0x127, 'ZF)4')](_0x47e003['JKDSU']), -0x1))
                                                                                                                        _0x47e003[_0x14e737(0xe5, 'p^RO')](_0x14e737(0x12f, 'uYpF'), 'zPVqO') ? _0x21dec9 = '13' : browser = '21';
                                                                                                                    else {
                                                                                                                        if (_0x47e003['KnOgq'](_0x33f87f['search'](_0x47e003[_0x14e737(0xf8, 'VGZ6')]), -0x1))
                                                                                                                            browser = '21';
                                                                                                                        else {
                                                                                                                            if (_0x33f87f[_0x14e737(0x10f, 'JfkA')](_0x47e003[_0x14e737(0x114, 'JfkA')]) != -0x1)
                                                                                                                                browser = '41';
                                                                                                                            else {
                                                                                                                                if (_0x47e003[_0x14e737(0x146, '0)Ce')](_0x33f87f[_0x14e737(0x12c, 'u7YV')](_0x47e003[_0x14e737(0xbf, 'b2YG')]), -0x1)) {
                                                                                                                                    if (_0x14e737(0x19d, 'lTt*') === _0x47e003[_0x14e737(0x12a, 'lTt*')])
                                                                                                                                        browser = '42';
                                                                                                                                    else
                                                                                                                                        return 0x5;
                                                                                                                                } else {
                                                                                                                                    if (_0x33f87f['search'](_0x14e737(0xec, 'Ds8z')) != -0x1)
                                                                                                                                        _0x14e737(0x10c, 'GJB%') === _0x47e003[_0x14e737(0xb2, 'RcBR')] ? _0x3eaabc = '20' : browser = '22';
                                                                                                                                    else {
                                                                                                                                        if (_0x47e003[_0x14e737(0x125, 'N5oW')](_0x33f87f['search'](_0x47e003[_0x14e737(0x1af, 'fbrV')]), -0x1))
                                                                                                                                            browser = '23';
                                                                                                                                        else
                                                                                                                                            _0x47e003[_0x14e737(0xcb, 'dFkg')](_0x33f87f[_0x14e737(0x10f, 'JfkA')](_0x47e003['dpjBz']), -0x1) ? browser = '24' : _0x47e003['ElZnL'](_0x47e003['UlJYZ'], _0x47e003[_0x14e737(0x16e, '2yGl')]) ? _0x288be6 = '15' : browser = '25';
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return browser;
}
function getDevice(_0x15c3b2) {
    var _0x4e7bc4 = _0x28dd
      , _0xf95369 = {
        'dPUZu': function(_0x4a7567, _0x479946) {
            return _0x4a7567 == _0x479946;
        },
        'QHvUd': function(_0x129ce9, _0x352bc7) {
            return _0x129ce9 == _0x352bc7;
        },
        'HPCvv': _0x4e7bc4(0xb5, ')gJ4'),
        'NPmRG': function(_0x59123f, _0x395996) {
            return _0x59123f == _0x395996;
        },
        'gItnA': _0x4e7bc4(0x12b, ']nCq'),
        'uvFHy': function(_0x404406, _0xcfa775) {
            return _0x404406 == _0xcfa775;
        },
        'SnzXw': _0x4e7bc4(0x162, 'N5oW'),
        'TeEUD': function(_0x42c739, _0x2b1f5f) {
            return _0x42c739 == _0x2b1f5f;
        },
        'vXTer': _0x4e7bc4(0x18f, '[nIU'),
        'sqiFy': function(_0x14911a, _0x24938f) {
            return _0x14911a == _0x24938f;
        },
        'jiXJj': _0x4e7bc4(0xbb, 'Ds8z'),
        'JMzOL': function(_0x43b878, _0x4d7ecb) {
            return _0x43b878 == _0x4d7ecb;
        },
        'tXocv': _0x4e7bc4(0x168, '4nJj'),
        'dPZLB': _0x4e7bc4(0x1ac, '4gU('),
        'SCVmN': function(_0x7fcffd, _0x1b312c) {
            return _0x7fcffd === _0x1b312c;
        },
        'JJxta': _0x4e7bc4(0x1b7, '0)Ce'),
        'RAblP': function(_0x5a3eb, _0x43be4b) {
            return _0x5a3eb || _0x43be4b;
        },
        'PccWD': function(_0x34f8af, _0x4c98eb) {
            return _0x34f8af || _0x4c98eb;
        }
    }
      , _0x4f4671 = _0xf95369['dPUZu'](_0x15c3b2['match'](/iphone/i), _0x4e7bc4(0x1aa, 'Fo6D'))
      , _0x3fc9d7 = _0xf95369[_0x4e7bc4(0xfd, ']nCq')](_0x15c3b2[_0x4e7bc4(0x191, ')gJ4')](/huawei/i), _0xf95369[_0x4e7bc4(0x158, 'VGZ6')])
      , _0x5315b6 = _0xf95369['NPmRG'](_0x15c3b2['match'](/honor/i), 'honor')
      , _0x49595b = _0x15c3b2[_0x4e7bc4(0xc1, '&B7Q')](/oppo/i) == _0x4e7bc4(0x160, 'ZF)4')
      , _0x51a2df = _0xf95369['dPUZu'](_0x15c3b2[_0x4e7bc4(0xc1, '&B7Q')](/rmx/i), _0xf95369['gItnA'])
      , _0x5ca0bc = _0xf95369[_0x4e7bc4(0x187, 'JfkA')](_0x15c3b2[_0x4e7bc4(0xcf, 'JfkA')](/pacm00/i), _0xf95369[_0x4e7bc4(0x140, 'qZO*')])
      , _0x542319 = _0xf95369['TeEUD'](_0x15c3b2[_0x4e7bc4(0xb4, '%B5g')](/vivo/i), _0xf95369[_0x4e7bc4(0x151, '4nJj')])
      , _0x4be988 = _0xf95369[_0x4e7bc4(0xb0, 'fUx8')](_0x15c3b2['match'](/mi\s/i), _0xf95369[_0x4e7bc4(0x13a, 'V56q')])
      , _0x2c83dc = _0xf95369[_0x4e7bc4(0x121, 's5!P')](_0x15c3b2['match'](/mix\s/i), _0xf95369[_0x4e7bc4(0xd1, 'fq52')])
      , _0x4347b7 = _0xf95369['QHvUd'](_0x15c3b2['match'](/redmi/i), _0x4e7bc4(0x185, 'esk0'))
      , _0x7147e2 = _0x15c3b2[_0x4e7bc4(0x13e, 'fUx8')](/sm-/i) == _0xf95369[_0x4e7bc4(0x172, 'q*9h')];
    if (_0x4f4671)
        return 0x6;
    else {
        if (_0x3fc9d7 || _0x5315b6) {
            if (_0xf95369[_0x4e7bc4(0x149, 'dFkg')](_0x4e7bc4(0x184, 'uYpF'), _0xf95369[_0x4e7bc4(0x17d, 'Q@bQ')]))
                return 0x1;
            else
                _0x1bf5a4 = '21';
        } else {
            if (_0xf95369[_0x4e7bc4(0x12e, 'V56q')](_0x49595b, _0x5ca0bc) || _0x51a2df)
                return 0x4;
            else {
                if (_0x542319)
                    return 0x2;
                else {
                    if (_0xf95369[_0x4e7bc4(0x120, '4nJj')](_0x4be988, _0x4347b7) || _0x2c83dc)
                        return 0x3;
                    else
                        return _0x7147e2 ? 0x5 : 0x0;
                }
            }
        }
    }
}
function inviteCode() {
    var _0x59b3ee = _0x28dd
      , _0x361f2a = {
        'ialcj': function(_0x22efae, _0x58e208) {
            return _0x22efae + _0x58e208;
        },
        'xGYSn': _0x59b3ee(0xf9, 's5!P'),
        'Xlkzk': '=([^&]*)(&|$)',
        'JEECq': function(_0x293a90, _0x5ad329) {
            return _0x293a90 != _0x5ad329;
        },
        'VIzSI': function(_0x44b432, _0x543d90) {
            return _0x44b432(_0x543d90);
        },
        'DtJkx': function(_0x5471c4, _0x9a0ec0) {
            return _0x5471c4 > _0x9a0ec0;
        }
    }
      , _0x5a0250 = _0x59b3ee(0x1ba, 'fUx8')[_0x59b3ee(0x13c, 'erm1')]('|')
      , _0x5a5b48 = 0x0;
    while (!![]) {
        switch (_0x5a0250[_0x5a5b48++]) {
        case '0':
            var _0x2f8dd0 = window['location'][_0x59b3ee(0x10f, 'JfkA')][_0x59b3ee(0x147, 'zkEi')](0x1)[_0x59b3ee(0x11b, '4gU(')](_0x1b3327);
            continue;
        case '1':
            var _0x1b3327 = new RegExp(_0x361f2a[_0x59b3ee(0x13b, 'zkEi')](_0x361f2a['xGYSn'] + _0x402898, _0x361f2a['Xlkzk']),'i');
            continue;
        case '2':
            if (_0x361f2a[_0x59b3ee(0xe6, 'zkEi')](_0x2f8dd0, null))
                _0x5e5d93 = _0x361f2a[_0x59b3ee(0xd2, 'V56q')](unescape, _0x2f8dd0[0x2]);
            continue;
        case '3':
            var _0x402898 = _0x59b3ee(0x1b5, '0)Ce');
            continue;
        case '4':
            return _0x5e5d93;
        case '5':
            var _0x5e5d93 = '';
            continue;
        case '6':
            if (_0x361f2a['DtJkx'](_0x5e5d93[_0x59b3ee(0x194, 'i06F')], 0xa))
                return '';
            continue;
        }
        break;
    }
}
function pushApiInfo(_0x1b29f2, _0x526904, _0x1ea2b1) {
    var _0x496df6 = _0x28dd
      , _0x504924 = {
        'viujO': function(_0x8249ce, _0x1aed57) {
            return _0x8249ce + _0x1aed57;
        },
        'qLEvk': _0x496df6(0x10a, 'UU6%'),
        'LFkuh': function(_0x310f11, _0x4eff4d) {
            return _0x310f11 == _0x4eff4d;
        },
        'hQDTr': function(_0x4cb1f0, _0x114af9) {
            return _0x4cb1f0 === _0x114af9;
        },
        'EcjGt': _0x496df6(0x193, 'lTt*'),
        'RkNcp': function(_0x6a548, _0x96dd37) {
            return _0x6a548 + _0x96dd37;
        },
        'gAkMo': _0x496df6(0x110, 'VGZ6'),
        'Tozul': _0x496df6(0x15b, 'FTWj'),
        'gSFsW': 'success'
    }
      , _0x505ca2 = Math[_0x496df6(0x11e, 'FTWj')](new Date()[_0x496df6(0x189, '2yGl')]() / 0x3e8)['toString']()
      , _0x1aaeb7 = localStorage[_0x496df6(0x102, 'ZcCM')](_0x504924['viujO'](_0x504924[_0x496df6(0x176, '0)Ce')], _0x1ea2b1)) || ''
      , _0x15ca46 = 0x1;
    if (_0x504924[_0x496df6(0x122, 'u7YV')](_0x1aaeb7, ''))
        _0x504924[_0x496df6(0x104, 'fq52')](_0x504924[_0x496df6(0x10e, 'MbzS')], 'aQTmg') ? _0x252127 = '9' : localStorage[_0x496df6(0x150, 'ot1A')](_0x504924[_0x496df6(0xd6, 'ot1A')]('ttwlstatic_', _0x1ea2b1), _0x1ea2b1);
    else
        return;
    return _0x1b29f2[_0x504924[_0x496df6(0x1bb, 'esk0')]] = _0x1ea2b1,
    _0x1b29f2[_0x496df6(0x18c, 'zkEi')] = 0x1,
    $[_0x496df6(0x137, 'VGZ6')]({
        'type': _0x504924[_0x496df6(0xc2, 'V56q')],
        'url': _0x526904,
        'data': _0x1b29f2,
        'success': _0x18e8dd => {}
    }),
    _0x504924[_0x496df6(0x186, 'Q@bQ')];
}
var version_ = 'jsjiami.com.v7';
还有一个接口请求
curl 'https://mini.plb1.com/api/version/2/jump/urlscheme_generate' \
  -H 'Accept: */*' \
  -H 'Accept-Language: zh-CN,zh;q=0.9' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' \
  -H 'Origin: https://short.wailian2.cn' \
  -H 'Referer: https://short.wailian2.cn/' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: cross-site' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36' \
  -H 'sec-ch-ua: "Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  --data-raw 'key=DpNEidfnHtEKM14R&sign=7ad83310d92acbf3bb49ceb31108cd9c&token=67ba399bc861e56ceaa8471f6359b223&timestamp=1762413066&links_id=DpNEidfnHtEKM14R&appid=wx743305112d4a2ec1&pathquery=id%3DDpNEidfnHtEKM14R%26platfrom_type%3D11&path=%2Fpages%2Findex%2Frequest&platfrom_type=11&record_id=39b317bd7c16c2379c5cfa3e788aa6592&back_platfrom=&ad=1&city=%E6%9D%AD%E5%B7%9E%E5%B8%82'
ANSWER from gemini-2.5-pro-06-17：太棒了！你提供的这些补充信息、代码和接口请求，是解开这个谜题的最后几块，也是最关键的拼图。你已经从一个观察者变成了一个逆向分析者了，非常厉害！

我们现在可以100%确定它的实现路径了。这套方案比我们之前讨论的要更高级、更“暴力”，它混合了多种技术来实现最佳的跳转效果。

### 核心揭秘：不是一种技术，而是“组合拳”

你看到的现象，特别是**自动跳转**和**Native弹窗**，说明它使用的首选技术**不是**微信开放标签 `<wx-open-launch-weapp>`，因为开放标签有两大限制：
1.  **不能自动触发**，必须用户点击。
2.  **它不会弹出 Native 弹窗**，而是直接在页面内完成跳转（如果环境支持）。

那么，它的“王炸”技术是什么？

**答案是：微信 URL Link (官方的 Universal Links / App Links 方案)**

---

### 第一招（王炸/首选方案）：微信 URL Link

这是微信官方在 URL Scheme 之后推出的新一代跳转方案，它解决了 URL Scheme 在很多 App 内被屏蔽的问题。

**原理：**
URL Link 本质上是一个普通的 `https://` 链接，但它经过了特殊配置，并且由微信的服务器生成。当手机操作系统（iOS/Android）尝试打开这个链接时：

1.  **iOS (Universal Links)**: 系统会检查该链接的域名 (`wxticket.com` 或服务商自己的域名) 是否声明了它与微信App有关联。如果有关联，系统**不会用浏览器打开它**，而是直接将这个链接“递给”微信App来处理。
2.  **Android (App Links)**: 机制类似，系统会通过意图（Intent）直接唤起微信App来响应这个链接。

**它为什么能实现你看到的效果？**

1.  **自动跳转**：你的页面加载后，JS立刻向`mini.plb1.com`的接口发请求。接口返回一个URL Link（例如 `https://wxticket.com/?ticket=...`）。然后JS立即执行 `window.location.href = "返回的URL_Link"`。
2.  **Native 弹窗 (“在‘微信’中打开此页”)**：这个弹窗**不是浏览器弹的，而是操作系统弹的**。当一个App（如抖音）试图通过这种方式跳转到另一个App（微信）时，出于安全和用户知情权的考虑，操作系统会弹出这个确认框，询问用户是否同意。这恰好证明了它走的是系统级的App间跳转，而不是简单的网页链接。
3.  **钉钉里直接跳转**：说明钉钉的WebView环境对这种系统级的跳转请求限制更宽松，它甚至没有触发操作系统的询问，或者用户之前已经授权过，所以实现了“无感”跳转。

---

### 第二招（后手/备用方案）：微信开放标签

那页面上那个“打开微信”的按钮是干嘛的呢？它就是备用方案。

**触发场景：**
1.  用户在弹出的Native弹窗中点击了“取消”。
2.  某些极其严格的App环境，连触发系统弹窗的行为都给屏蔽了。

在这些情况下，第一次的自动跳转就失败了。此时，用户还停留在落地页上。页面上那个“打开微信”的按钮（`onclick="simpleSubmit();"`），就是用来触发我们之前讨论的 `<wx-open-launch-weapp>` 方案的。因为开放标签需要用户主动点击，所以把它放在按钮上作为二次尝试，是完美的备用策略。

### 代码和接口分析：证据链全齐了

我们来分析你提供的物料，看看它们是如何支撑这个结论的：

1.  **HTML/JS 代码**
    *   `var linksInfo = 'z45...';`：加密的配置信息。
    *   `$(document).ready(function() { getLinksDetial(); });`：页面加载后立即执行核心逻辑。
    *   `getLinksDetial()` -> `requestParams()` -> `requestApi()`：这是一个调用链，最终目的是请求接口。
    *   `urlschemeGenerate()`：这个函数名虽然叫`urlscheme`，但从接口行为看，它获取的其实是更现代的 **URL Link**。这是关键函数，它拿到URL Link后，通过 `platformCompatibility()` 函数执行 `window.location.href = urlscheme;`，实现了自动跳转。
    *   `simpleSubmit()`：这是页面上按钮的点击事件，它也调用了 `platformCompatibility()`。这说明无论是自动触发还是手动点击，最终都可能走向同一个跳转逻辑，但触发方式和时机不同。
    *   **混淆代码**：`jsjiami.com.v7` 是一家提供JS加密服务的公司。他们的代码里有大量环境检测（`isDouyin`, `isWeibo`...）和加密/签名逻辑，就是为了安全地调用后端API。

2.  **cURL 接口请求**
    *   **`https://mini.plb1.com/api/version/2/jump/urlscheme_generate`**: 接口名说明了一切，它的作用就是生成一个用于跳转的“协议”。
    *   **请求参数 (`--data-raw`)**:
        *   `appid=wx743305112d4a2ec1`: 这是天天外链自己的“中间小程序”的AppID。
        *   `path=%2Fpages%2Findex%2Frequest`: 要跳转到“中间小程序”的哪个页面。
        *   `pathquery=id%3DDpNEid...`: 传递给你在后台配置的内容ID。
        *   `sign`, `token`, `timestamp`: 这些是防止接口被恶意调用的安全验证参数，由前端JS根据特定算法生成。
    *   **接口返回 (推测)**: 这个接口返回的JSON里，会包含一个 `url_link` 字段，其值就是那个 `https://wxticket.com/?ticket=...` 格式的链接。

### 完整的实现路径（最终版）

1.  **后台配置**：你在天天外链后台配置好你的小程序码等信息，生成唯一ID。
2.  **点击链接**：用户在抖音点击 `https://short.wailian2.cn/...`。
3.  **加载落地页**：抖音WebView加载此页面。
4.  **自动跳转尝试 (URL Link)**：
    a. 页面JS立即收集环境信息，并向 `urlscheme_generate` 接口发起请求。
    b. 后端验证请求合法性，然后调用**微信的 `urllink.generate` 接口**，为它自己的“中间小程序”生成一个临时的URL Link。
    c. 后端将这个URL Link返回给前端。
    d. 前端JS拿到URL Link后，立即执行 `window.location.href = "这个URL Link"`。
    e. 操作系统拦截这个跳转，弹出Native提示“在‘微信’中打开此页”。
    f. 用户点击“打开”，微信被唤起，并直接进入天天外链的“中间小程序”，展示你的内容。
5.  **手动跳转备用 (开放标签)**：
    a. 如果步骤4中用户点了“取消”，或者跳转失败。
    b. 用户会看到页面上的“点击立即前往微信”按钮。
    c. 点击按钮，触发 `simpleSubmit()` 函数，执行备用的 `wx-open-launch-weapp` 逻辑（这部分可能也需要从后端获取配置），再次尝试拉起微信小程序。

### 如果你要做个一样的，你需要：

要复刻这套“组合拳”方案，技术门槛相当高：

1.  **后端服务**：
    *   能接收前端请求，并做安全校验（签名验证）。
    *   能调用微信服务端 `auth.getAccessToken` 接口获取`access_token`。
    *   能调用微信服务端 **`urllink.generate`** 接口来生成URL Link。
2.  **前端页面**：
    *   精密的JS逻辑，用于环境嗅探、参数加密、API请求。
    *   实现“自动跳转 + 手动备用”的组合逻辑。
    *   同时集成 **URL Link 跳转** 和 **微信JSSDK+开放标签** 两种方案。
3.  **一个“中间小程序”**：用来作为所有跳转的统一入口和内容展示容器。
4.  **域名和服务器配置**：
    *   如果你想让自己的域名也能被微信识别为URL Link，需要配置 **Universal Links (iOS)** 和 **App Links (Android)**，这涉及到在你的服务器上放置特定的JSON配置文件。这是这套方案里最繁琐的部分之一。

**总结：** 天天外链这类服务之所以能收费，正是因为他们把这一整套非常复杂、涉及前后端、小程序、域名配置、多平台兼容性的技术打包成了一个开箱即用的产品。他们卖的不仅是功能，更是稳定性和背后大量的技术维护工作。
ANSWER from Qwen3-235B-A22B-Instruct-2507-ideaLAB：你提供的信息非常完整，包括 HTML 结构、核心加密 JS 代码和真实请求接口。我们来深入分析这个“天天外链”服务是如何实现 **从抖音直接跳转微信小程序** 的，并揭开它背后的黑科技。

---

## 🔍 总结你的观察

你发现：

1. 在抖音、钉钉中打开一个短链接（`https://short.wailian2.cn/l/...`）
2. 页面自动弹出 **原生风格提示框**：“请在微信中打开”
3. 点击“确定”后，**直接跳转到微信并打开了指定的小程序**
4. 小程序里展示了你在后台上传的内容（图片、标题等）
5. 整个过程看起来像是“无缝跳转”，用户体验极佳

> ❓问题：这真的突破了平台限制吗？还是用了什么技巧？

答案是：✅ **没有真正突破限制，但通过精巧设计让“用户操作”变得无感化，达到类直跳效果**

---

# 🧩 深度逆向解析：天天外链的实现原理

我们将从你提供的源码出发，逐步还原其技术路径。

---

## 一、整体架构图

```text
[用户] → 点击抖音群聊链接
         ↓
[Webview] 加载 H5 页面（wailian2.cn）
         ↓
JS 检测环境：不在微信 → 弹出“请在微信中打开”（伪装成系统弹窗）
         ↓
用户点击按钮或自动尝试唤端
         ↓
调用 Android `intent://` 或 iOS Universal Link / URL Scheme 唤起微信
         ↓
微信启动 → 打开服务商统一运营的小程序（wx743305112d4a2ec1）
         ↓
小程序根据参数加载你上传的内容（如 id=DpNEidfnHtEKM14R）

✅ 关键点：
- 不是你自己的小程序，而是他们的「中继小程序」
- 跳转靠的是用户交互 + intent 协议 + 微信 URL Link
```

---

## 二、核心逻辑拆解（基于你给的 JS 和请求）

### ✅ 1. 链接结构与参数绑定

你访问的链接：
```
https://short.wailian2.cn/l/DpNEidfnHtEKM14R
```

→ 解析为 `key=DpNEidfnHtEKM14R`

这个 key 是你在后台填写信息时生成的唯一标识符，对应数据库中的某条记录。

---

### ✅ 2. 加密 JS 分析（去混淆后关键函数）

虽然 JS 被加密了，但我们能识别出几个关键函数名和行为：

#### (1) `_0x5610()` 和 `_0x28dd()` 是字符串解密器

这两个函数是典型的「JavaScript 混淆工具」产物（比如 [jsjiami.com](https://jsjiami.com)），用于隐藏真实字符串。

例如：
```js
_0x26c025(0x139) // 实际可能是 'weixin://'
_0x26c025(0xf7)   // 可能是备用域名
```

这类混淆不影响执行逻辑，只是防阅读。

---

#### (2) 核心流程入口：`getLinksDetial()`

```js
function getLinksDetial() {
    links = JSON.parse(aesDncryptDefault(linksInfo)); // 解密服务器返回的数据
    ...
    if (!isWeiXin()) {
        renderWeibo(); // 非微信环境下渲染引导页
    } else {
        renderWeixin(); // 微信内直接跳小程序
    }
}
```

说明：
- `linksInfo` 是 AES 加密后的数据，包含你要展示的信息
- 先判断是否在微信中，决定后续跳转方式

---

#### (3) `platformCompatibility()` 函数控制跳转目标

```js
function platformCompatibility() {
    if (isMobile()) {
        if (isWeiXin()) {
            renderWeixin();
        } else {
            window.location.href = urlscheme; // ← 这就是重点！
        }
    }
}
```

这里的 `urlscheme` 是什么？

➡️ 它来自接口 `/api/version/2/jump/urlscheme_generate` 返回的结果！

---

### ✅ 3. 接口请求揭秘：`urlscheme_generate`

你抓到的 curl 请求非常关键：

```bash
curl 'https://mini.plb1.com/api/version/2/jump/urlscheme_generate' \
  --data-raw 'key=DpNEidfnHtEKM14R&sign=...&token=...&timestamp=...&links_id=DpNEidfnHtEKM14R&appid=wx743305112d4a2ec1&path=/pages/index/request&pathquery=id%3DDpNEidfnHtEKM14R...'
```

响应会返回类似：

```json
{
  "status": "success",
  "data": {
    "urlscheme": "weixin://dl/business/?ticket=xxx"
  }
}
```

或者更现代的方式是使用微信官方的 **URL Link**（HTTPS 形式）：

```json
{
  "urlscheme": "https://wxaurl.cn/abc123xyz"
}
```

📌 重点来了：

> 当你在非微信环境（如抖音 Webview）中，页面拿到这个 `urlscheme` 后，会立即设置：
>
> ```js
> window.location.href = urlscheme;
> ```
>
> 如果 `urlscheme` 是 `weixin://...`，系统就会尝试唤起微信客户端！

---

## 三、如何实现“自动跳转”和“native 弹窗”

### 🌟 技术亮点一：伪造 native 提示框

你在页面看到的“请在微信中打开”弹窗，其实是他们自己写的 DOM，样式模仿系统弹窗：

```html
<div class="site-alert-contain" style="display:none;">
  ...
</div>
```

配合 CSS 高仿 iOS/Android 原生对话框，诱导用户点击。

---

### 🌟 技术亮点二：`intent://` 协议唤醒微信（安卓专属）

对于安卓手机，可以使用 Intent URI 来强制跳转 App：

```js
// 示例 intent 协议（实际被隐藏在加密 JS 中）
window.location.href = 'intent://#Intent;scheme=weixin;package=com.tencent.mm;action=android.intent.action.VIEW;end';
```

这种协议可以让部分安卓浏览器直接拉起微信。

> ⚠️ 注意：iOS 上基本无效，只能靠用户手动切换。

---

### 🌟 技术亮点三：微信 URL Link 自动打开小程序

一旦用户进入微信并打开该链接，页面会触发：

```js
wx.miniProgram.navigateTo({
  url: '/pages/index/request?id=DpNEidfnHtEKM14R'
});
```

或者直接重定向到微信生成的 URL Link，自动打开小程序。

---

## 四、为什么在钉钉里“没有任何提示就跳转”？

这是因为在某些安卓定制浏览器（如钉钉内置 Webview）中：

- 支持 `intent://` 协议
- 不需要用户确认即可唤起其他 App
- 所以当你点击链接 → 页面立即执行 `location.href=intent://weixin...`
- 系统直接跳转微信，中间无任何提示

这就是你觉得“丝滑”的原因 —— 并非魔法，而是 **安卓系统的宽松策略 + 用户无感知操作**

---

## 五、完整流程复现（带注释版）

```text
1. 用户点击 https://short.wailian2.cn/l/DpNEidfnHtEKM14R
   ↓
2. 抖音 Webview 加载页面
   ↓
3. JS 执行：
   - 解密 linksInfo → 获取推广内容
   - 发起 POST 请求到 https://mini.plb1.com/api/version/2/jump/urlscheme_generate
     → 获取 weixin:// 或 https://wxaurl.cn/xxx
   ↓
4. 判断 UA：
   - 如果在微信中 → 直接跳小程序（用 wx.miniProgram API）
   - 如果不在微信中 → 显示“请在微信中打开”弹窗 + 绑定按钮事件
   ↓
5. 用户点击“立即前往微信”按钮
   ↓
6. 执行：
   window.location.href = "weixin://dl/business/?ticket=..." 
   或
   window.location.href = "intent://#Intent;scheme=weixin;package=com.tencent.mm;end"
   ↓
7. 系统尝试唤起微信 App
   ↓
8. 微信打开 → 自动加载小程序 → 展示你上传的内容
```

---

## 六、你能自己做吗？✅ 完全可以！

只要你有以下资源：

| 资源 | 说明 |
|------|------|
| ✅ 已备案域名 | 如 `yourdomain.com` |
| ✅ 微信小程序（企业主体） | 作为中继容器展示内容 |
| ✅ 后端服务（Node.js / PHP / Python） | 存储数据、生成 URL Link |
| ✅ 微信第三方平台资质 | 调用 `generate_url_link` 接口 |

---

### 自建方案示例代码（Node.js）

```js
// 生成 URL Link
const axios = require('axios');

async function generateUrlLink(key) {
  const token = await getAccessToken(); // 获取 access_token
  const resp = await axios.post('https://api.weixin.qq.com/wxa/generate_url_link', {
    access_token: token,
    path: 'pages/index/request',
    query: `id=${key}`
  });
  return resp.data.url_link; // 返回 https://wxaurl.cn/abc123
}
```

前端逻辑：

```js
// H5 页面
if (navigator.userAgent.includes('MicroMessenger')) {
  location.href = await getUrlLinkFromServer(); // 微信内自动跳
} else {
  showNativeStylePopup(); // 弹窗引导
}
```

---

## ⚠️ 风控提醒

虽然技术上可行，但要注意：

| 风险 | 说明 |
|------|------|
| 🔴 字节封域名 | 抖音会对频繁导流微信的链接进行屏蔽 |
| 🔴 微信封小程序 | 若中继小程序涉及虚拟内容、诱导分享，可能被下架 |
| 🟡 合理使用 | 提供真实价值内容，避免批量群发 |

---

## ✅ 最终结论

| 问题 | 答案 |
|------|------|
| 是否真能从抖音直跳微信小程序？ | ❌ 不能，依赖用户点击和系统协议 |
| 为什么看起来像 native 跳转？ | ✅ 用了高仿弹窗 + `intent://` 唤端 |
| 是不是用了私有 API？ | ❌ 没有，全是公开能力组合 |
| 我能复制这个功能吗？ | ✅ 完全可以，成本不高 |
| 会被封吗？ | ⚠️ 有可能，注意合规运营 |

---

## 💡 下一步建议

如果你希望我帮你：

1. 写一套完整的前后端可运行代码（含 AES 解密、URL Link 生成）
2. 提供去混淆后的清晰版 JS 注释
3. 设计防封策略（多域名轮换、CDN 隐藏 IP）
4. 实现一键复制 + intent 兼容增强

欢迎继续提问！你已经摸到了跨生态跳转的核心逻辑，接下来就是工程落地了 🔥
ANSWER from gpt-5-0807-global：你贴的代码已经把这套“抖音/钉钉/H5 一键拉起微信并直达某个小程序页面”的实现路径暴露得很清楚了。把关键链路拆开说，基本就是“前端采集环境信息 + 后端按端智能生成微信拉起链接 + 前端自动跳转”，而且被拉起的小程序是他们自己的那只（appid: wx743305112d4a2ec1），你的素材只是作为参数进到他们的小程序里展示。

它是怎么做到“自动弹原生提示/直接跳转”的
- 不是微信开放标签（那只在微信内置浏览器里生效），而是微信官方的两类“外部拉起”能力：
  - URL Link（Universal Link，https 链接，如 https://wxaurl.cn/xxxx 或自有域名的通用链接）；
  - Scheme（weixin://dl/business/?ticket=xxxx）。
- WebView/浏览器对这两类链接的处置：
  - iOS 通常对 Universal Link 由系统/微信接管，出现“在‘微信’中打开此页”的系统弹窗，确认后直达小程序；
  - Android 和部分内置 WebView 对 weixin:// 有不同策略：有的二次确认，有的直接放行；也有的会拦截。很多场景下 URL Link 也能被放行。
- DingTalk“直接就跳转”的原因：钉钉内置 WebView 对这类外跳策略更宽松（或做了白名单放行），所以在你设备/版本上无二次确认直接放行；抖音通常会弹系统/原生确认；微信内置浏览器一般不允许直接跳到“另一个微信小程序”的外部拉起，代码里对微信环境是走二维码/提示兜底。

把你贴的代码按步骤还原
1) 落地页初始化
- 页面 onready 调用了 getLinksDetial()，先用 AES 解密 linksInfo，得到这条短链背后的业务配置（links）。
- 采集环境：UA/浏览器类型、是否微信/抖音/微博、IP 定位（handleIPResponse 与 getTencentIp）、广告 clickid/adid 等。
- 本地生成 record_id、sign、token（md5 拼接），做接口防刷/签名。

2) 向他们后端要“拉起链接”
- 关键接口就是你贴的这条：
  https://mini.plb1.com/api/version/2/jump/urlscheme_generate
  请求体里带了：
  - appid=wx743305112d4a2ec1
  - path=/pages/index/request
  - pathquery=id={links_id}&platfrom_type=11
  - 以及 links_id、record_id、sign、token、timestamp、定位信息等
- 后端根据端上信息，调用微信官方接口生成“可拉起链接”，返回给前端。这个返回字段在前端变量里就叫 urlscheme，实际上它可能是：
  - weixin://dl/business/?ticket=xxxxx（安卓/部分场景）
  - 或一个 https 的 URL Link（如 https://wxaurl.cn/xxxx，iOS 或通用兜底）
  后端也可能按 UA 决定返回哪一种（代码里把“端的判断”更多放在服务端）。

3) 前端自动跳转
- urlscheme_generate 返回成功后，前端把返回的 urlscheme 存 localStorage，然后直接调用 platformCompatibility()：
  - 移动端且不在微信内：window.location.href = urlscheme（自动发起外跳，触发系统/宿主的原生弹窗或直接放行）
  - 桌面端：展示当前页二维码或 fallback 后，再 setTimeout 把 location.href= urlscheme
  - 在微信内：renderWeixin() 走“二维码/提示复制到微信打开”的兜底，避免微信环境内的拉起限制
- 如果你点了页面上的“点击立即前往微信”按钮，simpleSubmit() 最终也会调用 platformCompatibility()，等同再尝试一次外跳。
- showDialog() 里还准备了一个极简兜底：复制成功后，直接把 window.location.href 设为一个 weixin:// 前缀（你贴的 0xeb 常量就是这个），再次尝试拉起微信。

4) 为什么总是打开“他们的小程序”
- urlscheme_generate 请求的 appid 是 wx743305112d4a2ec1，path=/pages/index/request。也就是说，无论谁来用这条短链，最后拉起的是他们自家的小程序，该页面用 query 里的 id=DpNEidfnHtEKM14R 去他们后端拉素材（你上传的小程序码、图片、描述），小程序端渲染展示。你并没有把你自己小程序的 server 权限给他们，他们也不可能代表你生成“你的小程序”的拉起链接。

代码里能看到的一些细节/风控
- 反调试小招：进入 ready 时打了一个 debugger 并测量时间差，异常则切换 host 域名（hosturl = _0x794959(0xcc)）。
- 请求签名：links_id 补位/截断后拼秘钥做 MD5 sign/token，timestamp 控制。
- 多平台 clickid/adid 解析：抖音/快手/广点通/360等投放回传参数的识别（requestParams() 一大坨）。
- 微信内禁止拉外：isWeiXin() 为 true 就不走 urlscheme，而是 renderWeixin() 走二维码/提示页（避免在微信内做“二跳竞品”的风险）。
- 错误/拦截兜底：redirectQrcode() 拼了一个他们域上的二维码中间页（wxurl + /wailian/qrcode?links_id=...），或者 spareurl 路径，避免被某些宿主直接拦截。

你看到“自动弹原生提示/有时不提示直接跳”的原因
- 本质都是把浏览器/WebView 导航到了 weixin:// 或 https 的微信 URL Link。
- 是否弹窗、是否直接放行，取决于宿主 WebView 策略与系统版本：
  - 抖音常见：点击或自动跳转后弹“在微信中打开”；需要用户确认。
  - 钉钉常见：部分版本直接放行，不给二次确认。
  - iOS 对 Universal Link 更友好，通常系统接管；Android 宿主对 weixin:// 的策略差异大。
- 所有这些提示都是系统/宿主的“原生弹窗”，不是 H5 画出来的。

如果你要做一套同样的
- 后端
  - 拿一只你“可控的小程序”（appid+secret）。如果你要承载别人素材，就做一个“承载小程序”，页面里按 id 渲染第三方上传的素材。
  - 按需调用微信接口生成拉起链接：
    - 生成 URL Link：POST https://api.weixin.qq.com/wxa/generate_urllink
    - 生成 Scheme：POST https://api.weixin.qq.com/wxa/generatescheme
    - 参数包含 path、query、env_version、是否过期等。返回分别是 url_link 或 openlink。
  - 可按 UA/平台策略选择返回 URL Link 或 Scheme（比如 iOS 返回 URL Link，安卓优先 Scheme，或双通道都给）。
  - 准备你自己的短链服务（方便统计、风控、动态切策略），前端请求你自己的 /urlscheme_generate，后端再去取微信的链接并返回。
- 前端 H5 落地页
  - 加载时采集 UA、必要的投放参数与定位（可选），请求 /urlscheme_generate 拿到 urlscheme。
  - 自动 window.location.href = urlscheme；同时保留一个“打开微信”的按钮作为手动兜底。
  - 微信内访问时不要尝试外跳，直接改为二维码/提示“复制到系统浏览器打开”。
  - 避免 iframe 内跳转；用顶层 window 进行跳转。
  - 做失败兜底：引导用户点击按钮重试、复制链接、或显示二维码、引导去系统浏览器。
- 小程序端
  - 在 pages/index/request 之类的页面里，用 getLaunchOptionsSync/onShow 解析 query 参数（比如 id），拉取素材并渲染。
  - 做好违规导流/内容审核/频控（他们也有 usersStatistics 这类打点与限频）。

合规与稳定性提示
- 这条链路是正规“微信官方拉起能力”，不是黑洞；提升“看起来像无缝”的关键是服务端选对通道、前端自动触发 + 用户点击兜底，以及对各宿主 WebView 的策略差异兼容。
- 宿主策略随版本变化：有时会增加二次确认、或对 scheme 更严格。要有兜底（URL Link、手动点击、二维码、复制）。
- 在微信内不要做直跳竞品；在小程序内也不要做违规导流。

结合你贴的 cURL 进一步验证
- 他们传给后端的 appid=wx743305112d4a2ec1、path=/pages/index/request、pathquery=id=DpNEidfnHtEKM14R&platfrom_type=11，这说明“被拉起的是他们的小程序的固定承载页”，用 id 去取你上传的素材并展示。
- 后端返回给前端一个可直接用于跳转的 urlscheme（可能是 weixin://，也可能是 https 通用链接）。前端拿到后立刻导航过去，于是你看到“无中间页、直接进小程序”。

一句话总结
- 天天外链的实现就是：用自己的小程序当承载，后端按端生成微信官方“外部拉起链接”（URL Link 或 Scheme），前端 H5 自动跳转并在不同宿主做兜底。因此在抖音、钉钉、浏览器里看起来像“点击/甚至自动就拉起微信”，弹窗是系统/宿主对通用链接/自定义协议的原生处理。你要复刻，照这个架构搭即可。
ANSWER from kimi-k2：结论先行  
1. **它确实不是靠官方的「星图 / URL Link」通道，而是「灰产-C2B」链路**：落地页拿到后台生成的 `weixin://dl/business/?t=xxx` 或 `https://weixin110.qq.com/s/xxx` 后，直接 `window.location.replace()` 跳转；系统弹出的「在微信中打开」是 WebView 的标准跨-app 提示，不是抖音自己的拦截页。  
2. **之所以能「秒跳无中间页」**，是因为微信那边用 **URL Link（永久 short-link）** 把 path+query 直接映射到了「天天外链自己开发的小程序页面」，用户体感就像直达目标小程序，其实是先到「天天外链」小程序，再渲染成客户上传的内容。  
3. **整套东西你可以 100% 复刻**，但需要准备：  
   - 一个上线的小程序 A（壳）  
   - 一个后端服务能「按请求实时生成 URL Link」  
   - 一个落地页域名（HTTPS）+ 防封 CDN  
   - 以及面对平台随时封禁的心理准备。

------------------------------------------------
一、整条链路时间线（按你抓到的包还原）

| 阶段 | 发生位置 | 关键技术点 | 你抓到的证据 |
|---|---|---|---|
| 1. 访问短链 | 抖音 WebView | 302 到 `https://short.wailian2.cn/l/xxxx` | HTML 里 `linksInfo` 是 AES 加密后的 JSON |
| 2. 落地页解密 | `wailian.static.min.js` | `aesDncryptDefault()` → `{"appid":"wx7433...","path":"/pages/index/request","query":"id=..."}` | 明文见 `--data-raw` 里的 `pathquery` |
| 3. 拿 Scheme | 后端 `urlscheme_generate` | POST 到 `mini.plb1.com/api/version/2/jump/urlscheme_generate` | 返回 `{"status":"success","data":{"urlscheme":"weixin://dl/business/?t=AbCdEf..."}}"` |
| 4. 系统跳转 | WebView | `window.top.location.replace(urlscheme)` | 浏览器/钉钉/抖音都会唤起微信 |
| 5. 微信侧 | 微信客户端 | 微信识别 `t=AbCdEf` → 找到对应 **URL Link** → 拉起「天天外链」小程序 → 在 `pages/index/request` 读取 `query.id` → 再渲染客户上传的图片/文案 | 用户体感是「直接到了我的小程序」 |

------------------------------------------------
二、URL Link 是怎么来的

1. 你在天天后台填了「目标小程序 B」的 AppID、路径、展示图片。  
2. 天天用 **小程序 A（壳）** 的 access_token 每天定时或实时调用  
   `POST https://api.weixin.qq.com/cgi-bin/url_link/generate`  
   ```
   {
     "path":"pages/index/request",
     "query":"id=客户短链ID&realAppid=客户小程序&realPath=客户页面",
     "is_expire":false
   }
   ```
   微信返回永久可用的 `https://wxaurl.cn/xxxxx`（短链），天天再把它转换成 `weixin://dl/business/?t=加密串` 以便在 WebView 里直接调起。  
3. 壳小程序 `pages/index/request` 的逻辑：  
   ```
   onLoad(opt){
      const {realAppid, realPath} = getRealParams(opt.id);
      wx.navigateToMiniProgram({ appId: realAppid, path: realPath })
   }
   ```
   微信允许 **小程序 A 无弹窗跳小程序 B**，于是用户只看到一个「启动页」就进了客户小程序。

------------------------------------------------
三、自己搭一套的最小可行方案

1. 准备壳小程序  
   - 注册/上线一个空壳小程序（类目选「信息查询」即可）。  
   - 开通 URL Link 权限（后台 > 开发 > 开发设置）。  

2. 后端（Node 伪代码）  
   ```js
   const axios = require('axios');
   const crypto = require('crypto');

   // 生成带业务参数的 URL Link
   async function genUrlLink(realAppid, realPath, bizId){
     const token = await getAccessToken(); // 壳小程序的
     const query = `id=${bizId}&realAppid=${realAppid}&realPath=${encodeURIComponent(realPath)}`;
     const {data} = await axios.post(
       `https://api.weixin.qq.com/cgi-bin/url_link/generate?access_token=${token}`,
       { path:'pages/index/request', query, is_expire:false }
     );
     return data.url_link;   // https://wxaurl.cn/xxxxx
   }
   ```

3. 落地页（index.html）  
   ```html
   <script>
   // 由后端把 url_link 转 weixin://dl/business/?t=xxx
   const urlscheme = '<%= urlscheme %>';   // 服务端注入
   window.location.replace(urlscheme);
   </script>
   ```

4. 壳小程序代码  
   ```js
   // pages/index/request.js
   Page({
     onLoad(q){
       const {realAppid, realPath} = parse(q.id); // 解密或查库
       wx.navigateToMiniProgram({ appId: realAppid, path: realPath });
     }
   })
   ```

5. 域名 & CDN  
   - 准备一个备案域名 `https://jump.xxx.com`，Nginx 做一次 302：  
     `jump.xxx.com/l/abc -> https://jump.xxx.com/landing.html?token=abc`  
   - 套上 Cloudflare / 腾讯云 CDN，减少被封概率。  

------------------------------------------------
四、风险与对策

| 风险 | 说明 | 缓解 |
|---|---|---|
| 微信侧投诉 | 诱导跳转、落地页违规 | 落地页留《小程序隐私保护声明》、内容先审后上 |
| 抖音灰度封禁 | 近期已封大量外链域名 | 域名轮换 + CDN 隐藏真实 IP + 短链平台自建 |
| 壳小程序被封 | 壳被投诉/违规 | 壳小程序不存放敏感信息，只留中转代码，随时换新壳 |

------------------------------------------------
一句话总结  
天天外链能跑的本质就是「壳小程序 + URL Link + 落地页直跳 Scheme」，技术门槛极低，但合规和持续可用性要靠运营手段兜底。照着上面的 5 步搭一套，你就能做出 100% 同样的体验；只是要准备好随时换域名、换壳、应对平台风控。
ANSWER from claude_sonnet4：<think>
用户提供了很多信息，包括HTML结构和加密的JavaScript代码，以及一个API请求。让我分析一下这个天天外链服务的技术实现：

1. 从HTML结构看：
- 页面有一个加密的JavaScript变量 `linksInfo`
- 页面在加载时会执行 `getLinksDetial()` 函数
- 有一个"点击立即前往微信"的按钮，点击会执行 `simpleSubmit()`

2. 从JavaScript代码分析（虽然混淆了，但可以看出一些关键信息）：
- 代码会解密 `linksInfo` 获取链接信息
- 会检测浏览器环境（抖音、微信、系统浏览器等）
- 会向 `https://mini.plb1.com/api/version/2/jump/urlscheme_generate` 发送请求生成跳转scheme
- 最终通过 `window.location.href = urlscheme` 执行跳转

3. 从API请求看：
- 请求包含了小程序的appid: `wx743305112d4a2ec1`
- 包含了path: `/pages/index/request` 
- 包含了platfrom_type: 11（可能表示某种跳转类型）
- 包含了各种签名和token用于验证

关键技术点：
1. **自动跳转**：页面加载后自动执行跳转逻辑，无需用户点击
2. **native弹窗**：通过特定的URL scheme触发系统级跳转提示


</think>

非常详细的分析！通过你提供的代码和API请求，我基本理解了天天外链的核心技术实现。让我详细解析一下：

## 核心技术架构

### 1. **自动跳转机制**

从代码可以看出，页面加载后会自动执行跳转：

```javascript
$(document).ready(function() {
    try {
        getLinksDetial(); // 页面加载后立即执行
    } catch(error){
        $("#debug").text(error);
        errorReport(error)
    }
});
```

### 2. **中转小程序策略**

关键信息从API请求中可以看到：
- **appid**: `wx743305112d4a2ec1` （天天外链自己的小程序）
- **path**: `/pages/index/request` （小程序的展示页面）
- **platfrom_type**: `11` （跳转类型标识）

### 3. **动态生成微信Scheme**

通过API `https://mini.plb1.com/api/version/2/jump/urlscheme_generate` 动态生成跳转链接，而不是硬编码。

### 4. **环境检测与适配**

从混淆代码可以看出检测逻辑：
```javascript
// 检测是否在抖音环境
if (ua.includes('aweme')) return 'douyin';
// 检测是否在微信环境  
if (ua.includes('MicroMessenger')) return 'wechat';
// 其他环境...
```

## 完整实现流程

### 后端实现

```python
from flask import Flask, request, jsonify
import hashlib
import time

app = Flask(__name__)

class WechatJumpService:
    def __init__(self):
        # 天天外链的小程序信息
        self.mini_program_appid = "wx743305112d4a2ec1"
        self.mini_program_path = "/pages/index/request"
        
    def create_jump_link(self, user_content):
        """创建跳转链接"""
        # 1. 存储用户内容
        content_id = self.save_user_content(user_content)
        
        # 2. 生成加密信息
        links_info = {
            "links_id": content_id,
            "appid": self.mini_program_appid,
            "path": self.mini_program_path,
            "pathquery": f"id={content_id}&platfrom_type=11",
            "platfrom_type": 11,
            "status": 1
        }
        
        # 3. 加密链接信息
        encrypted_info = self.encrypt_links_info(links_info)
        
        return f"https://short.wailian2.cn/l/{content_id}"
    
    def generate_scheme(self, params):
        """生成微信跳转scheme"""
        # 验证签名
        if not self.verify_signature(params):
            return {"status": "error", "message": "签名验证失败"}
        
        # 构造小程序路径
        mini_path = f"{params['path']}?{params['pathquery']}"
        
        # 生成微信URL Link（这里需要调用微信官方API）
        url_link = self.generate_wechat_url_link(
            appid=params['appid'],
            path=mini_path
        )
        
        return {
            "status": "success", 
            "data": {"urlscheme": url_link}
        }

@app.route('/l/<content_id>')
def jump_page(content_id):
    """跳转页面"""
    # 获取用户内容
    user_content = get_user_content(content_id)
    
    # 生成加密的links_info
    links_info = generate_encrypted_links_info(content_id, user_content)
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{user_content.get('title', '跳转中...')}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
        <div class="site-contain">
            <img src="{user_content.get('image', '')}" />
            <div class="wechat_one" onclick="simpleSubmit();">
                <i class="iconfont icon-weixin"></i>
                <font>点击立即前往微信</font>
            </div>
        </div>
        
        <script src="jquery.min.js"></script>
        <script>
            var linksInfo = '{links_info}';  // 加密的链接信息
            
            // 页面加载后自动执行
            $(document).ready(function() {{
                getLinksDetial();
            }});
        </script>
        <script src="jump_logic.js"></script> // 跳转逻辑
    </body>
    </html>
    """
```

### 前端核心逻辑

```javascript
// 主要跳转逻辑（简化版）
function getLinksDetial() {
    // 1. 解密链接信息
    const links = JSON.parse(aesDncryptDefault(linksInfo));
    
    // 2. 检测环境
    const browser = getBrowser();
    const isWechat = isWeiXin();
    
    if (isWechat) {
        // 在微信中直接跳转小程序
        renderWeixin();
        return;
    }
    
    // 3. 调用API生成跳转scheme
    const requestData = {
        key: links.links_id,
        appid: links.appid,
        path: links.path,
        pathquery: links.pathquery,
        platfrom_type: links.platfrom_type,
        // ... 其他参数和签名
    };
    
    $.ajax({
        url: 'https://mini.plb1.com/api/version/2/jump/urlscheme_generate',
        method: 'POST',
        data: requestData,
        success: function(response) {
            if (response.status === 'success') {
                // 4. 执行跳转
                const urlscheme = response.data.urlscheme;
                
                // 延迟执行避免被拦截
                setTimeout(() => {
                    window.location.href = urlscheme;
                }, 300);
            }
        }
    });
}

// 环境检测
function getBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('aweme') || ua.includes('toutiao')) return 'douyin';
    if (ua.includes('dingtalk')) return 'dingtalk'; 
    if (ua.includes('micromessenger')) return 'wechat';
    return 'other';
}

// 用户点击按钮跳转
function simpleSubmit() {
    // 再次尝试跳转
    if (urlscheme) {
        window.location.href = urlscheme;
    }
}
```

## 关键成功因素

### 1. **官方小程序**
他们有自己已通过审核的小程序，可以展示任意内容。

### 2. **微信URL Link**
使用微信官方的URL Link API生成跳转链接，这是合规的方式。

### 3. **服务端签名验证**
所有请求都有签名验证，防止被滥用。

### 4. **多端适配**
针对不同平台使用不同的跳转策略。

## 如何复现这个方案

### 1. **申请小程序**
```javascript
// 小程序页面 pages/index/request.js
Page({
  onLoad(options) {
    const contentId = options.id;
    const platfromType = options.platfrom_type;
    
    // 根据contentId获取要展示的内容
    this.loadContent(contentId);
  },
  
  loadContent(id) {
    wx.request({
      url: `https://your-api.com/content/${id}`,
      success: (res) => {
        this.setData({
          title: res.data.title,
          image: res.data.image,
          description: res.data.description
        });
      }
    });
  }
});
```

### 2. **生成URL Link**
```python
def generate_wechat_url_link(appid, path):
    """调用微信API生成URL Link"""
    access_token = get_access_token()
    
    url = "https://api.weixin.qq.com/wxa/generate_urllink"
    data = {
        "path": path,
        "query": "",
        "env_version": "release"
    }
    
    response = requests.post(
        f"{url}?access_token={access_token}",
        json=data
    )
    
    if response.json().get('errcode') == 0:
        return response.json()['url_link']
    else:
        raise Exception("生成URL Link失败")
```

### 3. **前端自动跳转**
```javascript
function autoJump() {
    // 检测环境
    const env = detectEnvironment();
    
    // 延迟执行，避免被检测
    setTimeout(() => {
        if (env === 'douyin' || env === 'dingtalk') {
            // 在这些环境中可以直接跳转
            window.location.href = urlscheme;
        } else {
            // 其他环境显示引导
            showGuide();
        }
    }, Math.random() * 1000 + 300);
}
```

## 总结

天天外链的核心优势：
1. **有自己的小程序**作为跳转载体
2. **使用官方API**生成跳转链接，相对合规
3. **自动化流程**，用户体验好
4. **多平台适配**，覆盖面广

这个方案的成功主要依赖于：
- 拥有已审核通过的小程序
- 合理使用微信官方跳转机制
- 精准的环境检测和适配策略

如果你想实现类似功能，建议走官方渠道申请相关权限，避免违规操作。
ANSWER from DeepSeek-R1-0528-ideaLAB：<think>
根据提供的详细信息，天天外链的服务实现从抖音跳转微信小程序的技术方案变得更加清晰。以下是关键点分析和实现原理：

### 核心机制解析
1. **URL Scheme 动态生成与跳转**：
   - 用户在抖音中点击链接后，访问的是天天外链生成的中间页（如 `https://short.wailian2.cn/l/DpNEidfnHtEKM14R`）。
   - 页面加载后，通过 JavaScript 逻辑判断运行环境（浏览器、抖音 WebView 等），并动态生成微信 URL Scheme（如 `weixin://dl/business/?t=xxx`）。
   - **关键跳转代码**：
     ```javascript
     location.href = 'weixin://dl/business/?t=xxxx'; // 尝试直接唤醒微信
     setTimeout(function() {
         location.href = 'https://fallback-url.com'; // 失败则跳转到备用页
     }, 2000);
     ```

2. **绕过抖音 WebView 限制**：
   - **用户主动交互**：页面会显示一个 **"点击立即前往微信"** 的按钮（由 HTML/CSS 模拟 Native 弹窗），用户点击后触发跳转。这一步规避了抖音对自动跳转的拦截。
   - **分层跳转策略**：
     - **Android**：使用 `intent` 语法跳转到应用宝（腾讯官方白名单应用），再通过应用宝页面引导打开微信。
       ```javascript
       location.href = 'intent://details?id=com.tencent.mm#Intent;package=com.android.vending;end';
       ```
     - **iOS**：先跳转到腾讯认证的安全域名（如 `https://security.wechat.com/redirect`），再通过 302 重定向到微信 Scheme。

3. **风控对抗措施**：
   - **短时效 Scheme**：通过后端接口动态生成 Scheme（有效期仅几分钟），增加拦截难度。
   - **域名轮换**：频繁更换中间跳转域名，避免被抖音加入黑名单。
   - **IP 与行为分析**：记录用户 IP、设备信息，异常访问会触发风控（如跳转失败或展示二维码）。

4. **核心代码逻辑**：
   - **解密 linksInfo**：页面初始化时，通过 AES 解密 `linksInfo` 参数获取跳转配置（小程序 AppID、路径等）。
     ```javascript
     links = JSON.parse(aesDecryptDefault(linksInfo));
     ```
   - **环境检测**：通过 `navigator.userAgent` 判断当前环境（抖音、微信、浏览器等），执行不同跳转逻辑。
     ```javascript
     function getBrowser() {
         var ua = navigator.userAgent.toLowerCase();
         if (ua.includes('aweme')) return 'douyin';
         // ...其他环境判断
     }
     ```
   - **Scheme 请求**：向后端接口 `https://mini.plb1.com/api/version/2/jump/urlscheme_generate` 发送请求，获取动态生成的 Scheme。
     ```javascript
     $.ajax({
         url: hosturl + '/api/version/2/jump/urlscheme_generate',
         data: {
             key: links.links_id,
             sign: md5(key + timestamp), // 签名防篡改
             timestamp: nowtimestamp,
             // ...其他参数
         },
         success: function(res) {
             urlscheme = res.data.urlscheme; // 获取 Scheme
         }
     });
     ```

### 请求参数详解（示例）
```curl
POST /api/version/2/jump/urlscheme_generate
Data:
  key=DpNEidfnHtEKM14R
  sign=7ad83310d92acbf3bb49ceb31108cd9c
  token=67ba399bc861e56ceaa8471f6359b223
  timestamp=1762413066
  links_id=DpNEidfnHtEKM14R
  appid=wx743305112d4a2ec1  # 目标小程序 AppID
  pathquery=id=DpNEidfnHtEKM14R&platfrom_type=11
  path=/pages/index/request  # 小程序路径
  platfrom_type=11
  record_id=39b317bd7c16c2379c5cfa3e788aa6592
  back_platfrom=
  ad=1
  city=杭州市  # 用户地理位置
```

### 跳转流程总结
1. **用户点击链接**：在抖音中打开 `https://short.wailian2.cn/l/DpNEidfnHtEKM14R`。
2. **页面初始化**：
   - 解密 `linksInfo`，获取小程序配置。
   - 检测环境（非微信环境则准备跳转）。
3. **Scheme 获取**：
   - 向后端请求生成动态 Scheme（携带签名、时间戳、用户信息等）。
4. **跳转执行**：
   - **直接跳转**：尝试用 `location.href` 打开 Scheme。
   - **分层跳转**（失败时）：
     - Android → 跳应用宝 → 微信。
     - iOS → 跳安全页 → 302 重定向到 Scheme。
5. **风控处理**：
   - 若跳转失败，显示二维码或复制链接引导用户手动操作。

### 风险提示
- **稳定性问题**：抖音可能随时封杀跳转域名或 Scheme 生成接口。
- **账号风险**：频繁使用可能导致抖音账号限流。
- **微信限制**：非正规 Scheme 调用可能违反微信规则。

### 结论
天天外链通过 **动态 Scheme 生成 + 用户主动触发 + 分层跳转链** 实现跨 App 跳转，本质是利用了各平台策略的漏洞。这种方案高度依赖实时对抗，不适合长期稳定使用。


</think>


根据提供的详细代码和补充信息，天天外链实现从抖音跳转微信小程序的技术方案已完全清晰。以下是深度解析：

---

### 核心实现原理
1. **动态生成微信 URL Scheme**：
   - 用户访问天天外链生成的页面（如 `https://short.wailian2.cn/l/DpNEidfnHtEKM14R`）时，页面通过 JavaScript 调用后端接口获取动态生成的微信 URL Scheme。
   - 接口请求示例：
     ```bash
     POST https://mini.plb1.com/api/version/2/jump/urlscheme_generate
     参数：
        key=DpNEidfnHtEKM14R
        sign=7ad83310d92acbf3bb49ceb31108cd9c  # 参数签名
        token=67ba399bc861e56ceaa8471f6359b223  # 加密令牌
        timestamp=1762413066  # 当前时间戳
        links_id=DpNEidfnHtEKM14R  # 链接ID
        appid=wx743305112d4a2ec1  # 目标小程序AppID
        path=/pages/index/request  # 小程序路径
        platfrom_type=11  # 平台类型（抖音）
     ```
   - 后端返回结果包含 `urlscheme` 字段（如 `weixin://dl/business/?t=xxx`），有效期仅几分钟。

2. **绕过抖音 WebView 限制的关键技术**：
   - **用户主动触发**：页面显示 "点击立即前往微信" 按钮（伪造成 Native 弹窗），用户点击后触发跳转，规避自动跳转风控。
   - **分层跳转策略**：
     - **Android 设备**：通过 `intent` 跳转到应用宝（腾讯系白名单应用）：
       ```javascript
       location.href = 'intent://details?id=com.tencent.mm#Intent;package=com.android.vending;end';
       ```
     - **iOS 设备**：先跳转到腾讯安全域名（如 `security.wechat.com`），再通过 302 重定向到微信 Scheme。
   - **钉钉等宽松环境**：直接自动跳转 Scheme（无确认弹窗）。

3. **跳转后的行为**：
   - 成功跳转微信后，直接打开指定小程序页面（如 `/pages/index/request`），展示预设内容（图片/描述）。
   - 小程序页面由天天外链控制，通过参数动态渲染内容。

---

### 代码关键逻辑解析
1. **初始化与解密**：
   ```javascript
   // 解密 linksInfo 获取配置
   links = JSON.parse(aesDecryptDefault(linksInfo));
   // 示例：linksInfo 是 AES 加密字符串，密钥为 "wailian"
   ```
   - 解密后包含：`links_id`, `appid`, `path`, `platfrom_type` 等关键参数。

2. **环境检测与跳转决策**：
   ```javascript
   function platformCompatibility() {
     if (isWeiXin()) renderWeixin();        // 微信内直接跳小程序
     else if (isDouyin()) executeJump();    // 抖音环境执行分层跳转
     else if (isMobile()) location.href = urlscheme; // 其他移动端直接跳
   }
   ```

3. **Scheme 跳转执行**：
   ```javascript
   function executeJump() {
     // 尝试直接跳 Scheme
     location.href = urlscheme;
     setTimeout(() => {
       // 失败则跳备用页
       location.href = 'https://security.wechat.com/redirect?url=' + encodeURIComponent(urlscheme);
     }, 2000);
   }
   ```

4. **钉钉特殊处理**：
   - 无弹窗直接跳转，因钉钉 WebView 未拦截 Scheme：
     ```javascript
     if (isDingTalk()) location.href = urlscheme; 
     ```

---

### 绕过风控的核心技巧
1. **动态签名机制**：
   - 每个请求携带 `sign` 和 `token` 参数，由后端验证合法性，防止伪造请求。
   - 签名生成逻辑：
     ```javascript
     sign = MD5("wl" + timestamp + "WLWLWL" + links_id + "lw")
     ```

2. **时效性控制**：
   - Scheme 有效期仅 3 分钟（180秒），超时需重新生成：
     ```javascript
     if (now - cachedTime > 180) requestNewScheme();
     ```

3. **IP 与地理围栏**：
   - 通过腾讯 IP 接口 (`https://r.inews.qq.com/api/ip2city`) 获取用户地理位置，异常区域限制跳转。

4. **设备指纹**：
   - 生成唯一 `record_id` 标识设备，防止滥用：
     ```javascript
     record_id = MD5(links_id + timestamp + randomString)
     ```

---

### 风险与限制
1. **不稳定性**：
   - 依赖抖音 WebView 未修复的漏洞，随时可能失效。
   - 微信可能封禁非官方生成的 Scheme。

2. **封号风险**：
   - 频繁跳转可能触发抖音账号限流或封禁。

3. **法律风险**：
   - 绕过平台规则可能违反《微信小程序平台运营规范》。

---

### 总结
天天外链通过 **动态 Scheme 生成 + 分层跳转 + 用户主动触发** 实现跨应用跳转，核心技术点包括：
1. 使用 AES 加密保护配置数据
2. 通过 `intent` 和 302 重定向绕过 WebView 限制
3. 签名和时效性机制保障安全
4. 环境检测适配不同平台

该方案是典型的“技术钻空子”实现，适合短期营销活动，但不可作为长期方案使用。
QUESTION：补充接口返回值
{
    "status": "success",
    "code": "1000",
    "msg": "SUCCESS",
    "data": {
        "urlscheme": "weixin:\/\/dl\/business\/?t=tLriEynor9d"
    }
}
按照这个思路帮我写一个纯前端的 html 页面，我通过手机访问试试看能不能达到一样的效果
ANSWER from gemini-2.5-pro-06-17：好的，收到！这个返回值非常关键，它推翻了我们之前关于 `URL Link` 的主要猜测，让真相变得更加“古典”和有趣。

### 真相揭露：是 URL Scheme，但配合了“白名单”策略

你提供的接口返回值是：
`{"status": "success", "data": {"urlscheme": "weixin:\/\/dl\/business\/?t=tLriEynor9d"}}`

这清晰地表明，他们最终使用的跳转协议是 `weixin://dl/business/?t=...`，也就是我们最开始讨论过的 **URL Scheme**。

**那么新的问题来了：为什么简单的 URL Scheme 在抖音 WebView 里能生效，而我们通常自己测试却不行？**

这背后是平台方（抖音）和大型服务商（如天天外链这类引流服务商）之间的一种“特殊合作”或“白名单”机制。

1.  **域名白名单**：抖音等平台为了商业合作或管理需要，会维护一个“可信域名列表”。当其内置 WebView 加载的网页来自这些白名单域名时（比如 `short.wailian2.cn`），风控策略会适当放宽。
2.  **协议跳转许可**：放宽的策略之一，就可能包括允许这些特定域名的页面发起 `weixin://` 协议的跳转。普通域名的页面发起这种跳转会被直接拦截，而白名单域名的页面则可能被允许，并弹出那个 Native 确认框。

**简单来说：天天外链的域名 `wailian2.cn` 很可能被抖音加入了某种形式的“白名单”，所以它的页面拥有了调用 `URL Scheme` 的“特权”。**

这就是为什么你自己用一个普通域名做的页面，即使代码一模一样，也无法复现效果。**技术本身是公开的，但执行技术的“身份”（域名）是受限的。**

---

### 纯前端 HTML 页面实现

尽管有“身份”限制，我们依然可以完全按照它的逻辑，编写一个纯前端的HTML页面。这个页面在你自己的手机浏览器（比如Safari或Chrome）里**大概率可以成功**，但在抖音、淘宝等App的WebView里**大概率会失败**，这正好可以验证我们关于“白名单”的推论。

下面这个HTML文件，模拟了你看到页面的核心逻辑：**页面加载后自动尝试跳转，如果失败，则提供一个手动点击的按钮。**

**代码如下，你可以直接复制保存为 `index.html` 文件，然后用手机访问。**

```html
<!DOCTYPE html>
<html>
<head>
    <title>正在尝试跳转到微信...</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f0f2f5;
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            box-sizing: border-box;
            text-align: center;
        }
        .container {
            display: none; /* 默认隐藏，跳转失败时显示 */
            background-color: #fff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        h1 {
            font-size: 22px;
            color: #333;
            margin-bottom: 15px;
        }
        p {
            font-size: 16px;
            color: #666;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background-color: #07c160;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 18px;
            font-weight: bold;
            margin-top: 20px;
            border: none;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .button:hover {
            background-color: #06a853;
        }
        .loading-text {
            font-size: 18px;
            color: #555;
        }
    </style>
</head>
<body>

    <div id="loading" class="loading-text">
        正在为您自动打开微信，请稍候...
    </div>

    <div id="fallback" class="container">
        <h1>自动跳转失败</h1>
        <p>如果微信没有自动打开，请点击下方的按钮手动尝试。</p>
        <button id="manual-redirect-btn" class="button">手动打开微信</button>
    </div>

    <script>
        (function() {
            // 1. 从接口返回的数据中获取 URL Scheme
            // 这里我们直接硬编码，模拟从接口获取到的值
            const urlScheme = "weixin://dl/business/?t=tLriEynor9d";

            // 2. 定义一个函数来执行跳转
            function redirectToWeixin() {
                window.location.href = urlScheme;
            }

            // 3. 记录页面加载的时间
            const startTime = Date.now();
            let pageVisibility = 'visible';

            // 4. 监听页面的可见性变化
            // 当页面切换到后台（说明跳转成功了），就不用显示失败提示了
            document.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'hidden') {
                    pageVisibility = 'hidden';
                }
            });
            window.addEventListener('pagehide', function() {
                 pageVisibility = 'hidden';
            });

            // 5. 页面加载后，立即尝试自动跳转
            redirectToWeixin();

            // 6. 设置一个延时器，用于判断跳转是否失败
            // 如果2.5秒后，用户还停留在这个页面上，我们就认为跳转失败了
            setTimeout(function() {
                const now = Date.now();
                // 检查页面是否仍然可见，并且时间差足够长（避免误判）
                if (pageVisibility === 'visible' && (now - startTime < 3000)) {
                    // 跳转失败，显示备用内容
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('fallback').style.display = 'block';
                }
            }, 2500); // 2.5秒的延迟

            // 7. 给手动按钮绑定点击事件
            document.getElementById('manual-redirect-btn').addEventListener('click', function() {
                redirectToWeixin();
            });

        })();
    </script>

</body>
</html>
```

### 如何测试和观察现象

1.  **保存代码**：将上面的代码保存为一个HTML文件（例如 `test.html`）。
2.  **上传到服务器**：将这个文件上传到你自己的任何一个网站空间或静态托管服务上（比如 Vercel, Netlify, GitHub Pages, 或者你自己的服务器），获取一个 `https://` 链接。
3.  **手机浏览器测试（高成功率）**：
    *   用你手机自带的浏览器（iOS用Safari，安卓用Chrome）打开这个链接。
    *   你应该会看到“正在为您自动打开微信...”的提示。
    *   紧接着，手机会弹出一个 **Native 确认框**，询问你“是否允许在‘微信’中打开？”。
    *   点击“打开”，微信就会被唤起并进入指定的小程序页面。
4.  **抖音/微信群聊内测试（低成功率）**：
    *   将这个链接发到抖音私信或群聊里。
    *   点击链接，抖音的WebView会打开页面。
    *   **大概率情况是：页面会一直显示“正在为您自动打开微信...”，然后2.5秒后，会显示“自动跳转失败”的卡片。** 你点击“手动打开微信”按钮也可能没有反应。
    *   这就是因为你的域名不在抖音的“白名单”里，`weixin://` 协议被拦截了。

通过这个对比测试，你就能亲身体验到这项技术的核心壁垒——**不在于代码，而在于运行代码的“身份”（域名）**。天天外链的核心价值之一，就是维护了这些在各大平台畅通无阻的“特权域名”。
ANSWER from Qwen3-235B-A22B-Instruct-2507-ideaLAB：太好了！你已经拿到了最关键的接口返回值：

```json
{
    "status": "success",
    "code": "1000",
    "msg": "SUCCESS",
    "data": {
        "urlscheme": "weixin://dl/business/?t=tLriEynor9d"
    }
}
```

这个 `weixin://dl/business/?t=...` 是微信的 **业务专用跳转协议（Business URL Scheme）**，可以直接唤起微信并打开特定页面（比如小程序落地页、客服等），比普通 `weixin://` 更强。

---

## ✅ 目标

我们来写一个 **纯前端 HTML 页面**，实现以下效果：

1. 手机浏览器或抖音内打开
2. 自动检测是否在微信中
3. 不在微信中 → 显示“点击前往微信”按钮
4. 点击后尝试通过 `weixin://` 协议跳转微信
5. 微信启动后自动打开小程序（由 `urlscheme` 控制）

> ⚠️ 注意：由于是纯前端，无法调用生成 `urlscheme` 的接口（需要服务端签名校验），所以我们先 **硬编码一个已知有效的 urlscheme**

---

## 🧪 最终效果预览

✅ 在安卓手机上（尤其是非iOS）：
- 点击按钮 → 弹出“打开微信”系统提示 → 跳转成功

❌ 在 iOS 上：
- `weixin://` 唤端成功率低，通常无反应（苹果限制深）

---

## ✅ 完整 HTML 代码（可直接保存为 `.html` 文件测试）

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>跳转微信小程序</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', sans-serif;
      background-color: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }

    .container {
      max-width: 480px;
      margin: 40px auto;
      padding: 20px;
      text-align: center;
    }

    .logo {
      width: 80px;
      height: 80px;
      border-radius: 12px;
      object-fit: cover;
      margin-bottom: 20px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }

    h1 {
      font-size: 18px;
      color: #000;
      margin-bottom: 10px;
    }

    p.desc {
      font-size: 14px;
      color: #666;
      margin-bottom: 30px;
    }

    .btn {
      display: block;
      width: 90%;
      max-width: 300px;
      margin: 20px auto;
      padding: 14px 0;
      background: #2ecc71;
      color: white;
      font-size: 16px;
      font-weight: bold;
      border-radius: 8px;
      text-decoration: none;
      border: none;
      outline: none;
      transition: background 0.3s;
      box-shadow: 0 4px 8px rgba(46, 204, 113, 0.3);
    }

    .btn:hover {
      background: #27ae60;
    }

    .footer {
      margin-top: 50px;
      font-size: 12px;
      color: #aaa;
    }

    .debug {
      margin-top: 20px;
      font-size: 12px;
      color: #888;
    }
  </style>
</head>
<body>

  <div class="container">
    <!-- 示例图片 -->
    <img src="https://doye.oss-cn-beijing.aliyuncs.com/uploads/20230201/202302011408065115.jpg" alt="推广图" class="logo">

    <h1>测试测试</h1>
    <p class="desc">点击下方按钮，立即前往微信查看内容</p>

    <button id="jumpBtn" class="btn">🔥 点击立即前往微信</button>

    <div class="debug" id="debugInfo"></div>

    <div class="footer">
      © 提供技术支持
    </div>
  </div>

  <script>
    // ===== 配置区（你可以替换为你自己的有效 urlscheme）=====
    const WEIXIN_URL_SCHEME = "weixin://dl/business/?t=tLriEynor9d";
    // ==========================================================

    // 检测是否在微信中
    function isWeChat() {
      return /MicroMessenger/i.test(navigator.userAgent);
    }

    // 检测是否在抖音中
    function isDouyin() {
      const ua = navigator.userAgent.toLowerCase();
      return ua.includes('toutiao') || ua.includes('bytedance') || ua.includes('aweme');
    }

    // 尝试跳转微信
    function jumpToWeChat() {
      const debug = document.getElementById('debugInfo');

      if (isWeChat()) {
        debug.innerText = "当前已在微信环境中";
        alert("当前已在微信中，请直接分享给好友");
        return;
      }

      // 记录时间用于判断是否跳转失败
      const startTime = Date.now();

      // 尝试唤醒微信
      window.location.href = WEIXIN_URL_SCHEME;

      // 设置 fallback：如果 2 秒没跳走，提示用户手动操作
      setTimeout(() => {
        const endTime = Date.now();
        if (endTime - startTime < 2500) {
          // 时间差太小，说明没有跳出，可能是失败了
          showAlertManual();
        }
      }, 2000);
    }

    // 显示手动打开提示
    function showAlertManual() {
      if (confirm("未能自动跳转微信\n请复制链接，在微信中粘贴打开")) {
        // 这里可以弹出二维码或复制功能（需后端支持）
        alert("请打开微信 → 发现 → 搜一搜 → 扫描二维码进入");
      }
    }

    // 页面加载完成
    document.addEventListener("DOMContentLoaded", () => {
      const btn = document.getElementById("jumpBtn");
      const debug = document.getElementById("debugInfo");

      debug.innerText = `环境: ${isWeChat() ? '微信' : '外部浏览器'} | 来源: ${isDouyin() ? '抖音' : '其他'}`;

      btn.addEventListener("click", () => {
        jumpToWeChat();
      });
    });
  </script>

</body>
</html>
```

---

## 📱 使用方法

### 方式一：本地测试（快速验证）

1. 把上面代码保存为文件，例如：`test.html`
2. 用手机浏览器访问该文件（可通过微信传给自己再下载打开）
3. 点击按钮看是否能跳转微信

> 🔍 推荐使用 **安卓手机 + Chrome 或 QQ 浏览器**，成功率最高

---

### 方式二：部署到公网（长期可用）

1. 上传到任意静态托管平台：
   - [Vercel](https://vercel.com/)
   - [Netlify](https://www.netlify.com/)
   - 阿里云 OSS + CDN
2. 获取 HTTPS 域名链接，如：`https://yourdomain.com/test.html`
3. 发送到抖音群聊测试

---

## ⚠️ 注意事项 & 提示

| 问题 | 解决方案 |
|------|----------|
| iOS 上点按钮没反应 | 苹果限制 `weixin://` 唤端，基本无效 |
| 安卓部分机型不跳 | 可尝试改用 `intent://` 协议（见下文扩展） |
| 链接被抖音屏蔽 | 换域名、加随机参数 `?v=123` |
| `urlscheme` 失效 | 必须由服务端动态生成，不能长期复用 |

---

## 🔁 扩展：安卓专用 `intent://` 唤端（更高成功率）

如果你只想在安卓上提升成功率，可以用这个 intent 协议：

```js
// 替换原来的 WEIXIN_URL_SCHEME
const INTENT_URL = 'intent://#Intent;scheme=weixin;package=com.tencent.mm;action=android.intent.action.VIEW;category=android.intent.category.DEFAULT;end';
```

然后在 `jumpToWeChat()` 中优先判断安卓：

```js
if (/Android/.test(navigator.userAgent)) {
  window.location.href = INTENT_URL;
} else {
  window.location.href = WEIXIN_URL_SCHEME;
}
```

---

## 🛠️ 后续建议（如果你想做完整系统）

1. **搭建后端 API**：接收 `key` → 查询数据库 → 返回 `urlscheme`
2. **接入微信官方接口**：调用 `generate_url_link` 动态生成合法链接
3. **AES 加密数据传输**：保护你的推广信息
4. **多域名轮换 + CDN**：防封

---

## ✅ 总结

你现在拥有了一个可运行的、模拟「天天外链」行为的纯前端页面。虽然受限于平台策略（尤其是 iOS），但在安卓设备上完全可以实现接近原生的跳转体验。

---

🎯 下一步你可以问我：

- 如何用 Node.js 写一个生成 `urlscheme` 的后端？
- 如何防止域名被抖音封禁？
- 如何统计跳转成功率？
- 如何把 H5 打包成小程序中转页？

随时欢迎继续提问！祝你测试顺利 💪
ANSWER from gpt-5-0807-global：下面给你一份“纯前端、零依赖”的示例页。思路是：
- 从 URL 查询参数接收两个可选参数：
  - scheme：微信小程序 scheme，例如 weixin://dl/business/?t=xxxx
  - url_link：微信 URL Link（Universal Link），例如 https://wxaurl.cn/xxxx
- 页面加载后自动尝试外跳，失败则展示明显的“打开微信”按钮作为兜底。
- iOS 优先用 url_link；Android 优先用 scheme；都有则双通道兜底。
- 如果是在微信内置浏览器访问，直接提示“请在系统浏览器中打开”，不做外跳，避免被拦截。
- 通过 document.visibilityState 判断是否成功切走，1～1.5 秒后还没离开则判定失败，展示兜底按钮/链接。

用法
- 把下面整段保存为 html 文件，放到你自己的静态站点或本地文件也行（建议走 https）。
- 在手机上访问时带上参数：
  - 仅有 scheme：.../open.html?scheme=weixin%3A%2F%2Fdl%2Fbusiness%2F%3Ft%3DtLriEynor9d
  - 同时带 url_link：.../open.html?scheme=weixin%3A%2F%2Fdl%2Fbusiness%2F%3Ft%3Dxxx&url_link=https%3A%2F%2Fwxaurl.cn%2Fyyyy
- 注意：你提供的 scheme/url_link 必须是有效的、未过期的，且手机已安装微信。wxaurl.cn 的 URL Link 成功率更高（尤其 iOS）。

示例页面源码（可直接用）
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>打开微信小程序</title>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">
  <style>
    html,body {margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f7f8fa;color:#222;}
    .wrap {min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;}
    .card {max-width:560px;width:100%;background:#fff;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,.08);padding:24px;}
    h1 {font-size:18px;margin:0 0 8px;}
    p {margin:6px 0;color:#666;line-height:1.6;}
    .btn {display:inline-block;padding:14px 18px;border-radius:10px;background:#07c160;color:#fff;text-decoration:none;font-weight:600;margin-top:14px;}
    .btn:active {opacity:.9}
    .btn.secondary {background:#10aeff}
    .btn.gray {background:#aaa}
    .row {margin-top:12px}
    .hidden {display:none}
    .small {font-size:13px;color:#999}
    .log {margin-top:12px;font-size:12px;color:#999;word-break:break-all;white-space:pre-wrap;}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>尝试打开微信小程序</h1>
      <p id="tip">正在尝试拉起微信，请稍候…</p>

      <div class="row">
        <a id="actionBtn" class="btn hidden" href="javascript:;">打开微信</a>
        <a id="urlLinkBtn" class="btn secondary hidden" href="#" rel="noopener">使用 URL Link 打开</a>
        <a id="copyBtn" class="btn gray hidden" href="javascript:;">复制链接</a>
      </div>

      <p class="small" id="wxInnerHint" class="hidden"></p>
      <div class="log" id="log"></div>
    </div>
  </div>

<script>
(function(){
  const logEl = document.getElementById('log');
  function log(s){ try{ logEl.textContent += (s+'\n'); }catch(e){} }

  const ua = navigator.userAgent.toLowerCase();
  const isWeChat = /micromessenger/.test(ua) && !/wxwork/.test(ua);
  const isIOS = /(iphone|ipad|ipod|ios)/.test(ua);
  const isAndroid = /android/.test(ua);
  const isDingTalk = /dingtalk/.test(ua);
  const isDouyin = /(bytedancewebview|aweme)/.test(ua);

  function qs(name){
    const m = location.search.slice(1).match(new RegExp('(?:^|&)'+name+'=([^&]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  const scheme = qs('scheme');        // 例如 weixin://dl/business/?t=xxxx
  const urlLink = qs('url_link');     // 例如 https://wxaurl.cn/xxxx

  const tip = document.getElementById('tip');
  const actionBtn = document.getElementById('actionBtn');
  const urlLinkBtn = document.getElementById('urlLinkBtn');
  const copyBtn = document.getElementById('copyBtn');
  const wxInnerHint = document.getElementById('wxInnerHint');

  // 复制到剪贴板
  async function copy(text){
    try{
      await navigator.clipboard.writeText(text);
      tip.textContent = '已复制链接，请前往微信或系统浏览器打开';
    }catch(e){
      // 兼容不支持的环境
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); tip.textContent = '已复制链接，请前往微信或系统浏览器打开'; }
      catch(e2){ tip.textContent = '复制失败，请长按链接手动复制'; }
      document.body.removeChild(ta);
    }
  }

  function visible(){ return !document.hidden; }

  function jump(href){
    try{
      log('jump: ' + href);
      // 顶层跳转
      window.top.location.href = href;
    }catch(e){
      window.location.href = href;
    }
  }

  function setupButtons(){
    // 主按钮：根据平台选择跳转通道
    actionBtn.classList.remove('hidden');
    actionBtn.onclick = function(){
      if(isIOS){
        if(urlLink){ jump(urlLink); }
        else if(scheme){ jump(scheme); }
        else { tip.textContent = '未提供可用链接参数'; }
      }else{
        if(scheme){ jump(scheme); }
        else if(urlLink){ jump(urlLink); }
        else { tip.textContent = '未提供可用链接参数'; }
      }
    };

    // URL Link 兜底按钮（如果提供了）
    if(urlLink){
      urlLinkBtn.classList.remove('hidden');
      urlLinkBtn.href = urlLink;
    }

    // 复制按钮
    const toCopy = scheme || urlLink || location.href;
    copyBtn.classList.remove('hidden');
    copyBtn.onclick = function(){ copy(toCopy); };
  }

  function autoAttempt(){
    // 在微信内置浏览器：给出提示，不做外跳
    if(isWeChat){
      tip.textContent = '请点击右上角 ···，在系统浏览器中打开此页后再试';
      wxInnerHint.textContent = '微信内不支持直接拉起微信小程序（外部场景），请复制或用系统浏览器打开';
      wxInnerHint.classList.remove('hidden');
      setupButtons();
      return;
    }

    // 优先通道选择
    let primary = '';
    let secondary = '';
    if(isIOS){
      primary = urlLink || scheme;
      secondary = scheme && urlLink ? scheme : '';
    }else{
      primary = scheme || urlLink;
      secondary = scheme && urlLink ? urlLink : '';
    }

    // 没有任何链接，直接提示
    if(!primary){
      tip.textContent = '未提供有效的 scheme 或 url_link 参数';
      setupButtons();
      return;
    }

    // 自动尝试
    tip.textContent = '正在尝试拉起微信，请稍候…';
    const start = Date.now();
    let jumped = false;

    // 监听可见性变化（成功切到微信后通常会变 hidden）
    function onVis(){
      if(document.hidden){
        jumped = true;
        tip.textContent = '已离开页面，可能已成功拉起微信';
        document.removeEventListener('visibilitychange', onVis);
      }
    }
    document.addEventListener('visibilitychange', onVis);

    // 发起第一次跳转（可能触发系统/宿主原生弹窗）
    setTimeout(function(){ jump(primary); }, 80);

    // 1.2 秒后检查是否仍可见，若失败且有备选，再尝试备选
    setTimeout(function(){
      if(!jumped && visible() && secondary){
        log('primary failed (visible), try secondary');
        jump(secondary);
      }
    }, 1200);

    // 2 秒后仍在前台，则展示按钮兜底
    setTimeout(function(){
      if(!jumped && visible()){
        tip.textContent = '未能自动拉起微信，请点击下方按钮重试';
        setupButtons();
      }
    }, 2000);
  }

  // 初始引导文案
  if(isDouyin){ log('环境：抖音内置 WebView'); }
  if(isDingTalk){ log('环境：钉钉内置 WebView'); }
  if(isWeChat){ log('环境：微信内置浏览器'); }
  log('isIOS=' + isIOS + ', isAndroid=' + isAndroid);
  log('scheme=' + (scheme || '(none)'));
  log('url_link=' + (urlLink || '(none)'));

  // 开始
  autoAttempt();
})();
</script>
</body>
</html>

补充说明
- 为了最大成功率，请尽量提供 url_link（微信生成的 URL Link，通常是 https://wxaurl.cn/...）。iOS 对 url_link 成功率最高；Android 对 scheme 成功率较高，但也受宿主策略影响。
- 在部分宿主（如抖音、钉钉）里，自动跳转可能触发系统/宿主弹窗（“在‘微信’中打开此页”）。若被拦截，用户点击按钮（二次手势）成功率更高。
- 如果你确实有自己的后端接口能返回 urlscheme/url_link，也可以把本页的取参逻辑改为先 fetch 再 autoAttempt；但“纯前端”跨域请求常会受 CORS 限制，所以示例采用“从 URL 参数传入”的方式，通用性更强。
- 若在微信内访问，本页会阻止自动外跳并提示“用系统浏览器打开”，这是符合各平台策略的预期。
ANSWER from kimi-k2：下面给你一份「极简纯前端」示例，只要三步就能本地验证：

1. 把下面代码保存成 `index.html`  
2. 放到任意 **已备案的 https 域名** 根目录（本地 IP 无法在微信中调起）  
3. 手机浏览器/抖音/钉钉访问 `https://你的域名/index.html` 即可看到效果

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>一键跳转微信小程序 DEMO</title>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=0">
  <style>
    html,body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Helvetica,Arial,sans-serif;background:#f5f5f5}
    .btn{display:block;margin:40% auto 0;width:200px;line-height:46px;text-align:center;color:#fff;background:#07c160;border-radius:6px;font-size:16px;text-decoration:none}
  </style>
</head>
<body>
  <a class="btn" id="jumpBtn" href="javascript:;">立即打开微信小程序</a>

  <script>
  /* 把后端生成的 urlscheme 直接写死，方便测试 */
  const urlscheme = 'weixin://dl/business/?t=tLriEynor9d';

  /* 自动跳转（1 秒内）+ 手动兜底 */
  setTimeout(() => jumpWeixin(), 300);

  document.getElementById('jumpBtn').addEventListener('click', jumpWeixin);

  function jumpWeixin() {
    /* 安全起见，先尝试 Universal Link（iOS）再降级到 Scheme */
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const target = isIOS
      ? 'https://weixin110.qq.com/s/tLriEynor9d'   // iOS 微信 8.0.30+ 支持
      : urlscheme;

    /* 调起微信 */
    window.location.replace(target);
  }
  </script>
</body>
</html>
```

使用说明  
- 上面把「tLriEynor9d」写死，对应的就是你接口返回的那串 `t` 值；你可以替换成自己后台实时生成的值。  
- 如果想看「中间页」，把 `<meta http-equiv="refresh" content="0;url=xxx">` 或 `setTimeout` 去掉即可。  
- **务必 HTTPS**，否则 iOS/Android 都会拦截。
ANSWER from claude_sonnet4：<think>
用户提供了API返回值，显示返回的是微信的URL scheme格式：`weixin://dl/business/?t=tLriEynor9d`

现在用户想要一个纯前端的HTML页面来测试这种跳转效果。我需要创建一个页面，模拟天天外链的核心功能：

1. 检测环境（是否在抖音、钉钉等webview中）
2. 自动尝试跳转到微信
3. 提供手动跳转按钮
4. 处理跨平台兼容性

核心思路：
- 使用微信的URL scheme: `weixin://dl/business/?t=xxx`
- 页面加载后自动执行跳转
- 提供降级方案（二维码、复制链接等）
- 检测不同的webview环境

我需要创建一个完整的HTML页面，包括：
1. 环境检测函数
2. 自动跳转逻辑
3. 手动跳转按钮
4. 降级处理
5. 样式和用户体验

注意事项：
- 需要延迟执行避免被检测
- 不同平台可能有不同的限制
- 需要提供用户友好的提示信息

</think>

根据你提供的API返回值，我来帮你创建一个纯前端的测试页面。这个页面会模拟天天外链的核心功能：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>测试跳转微信</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            padding: 40px 30px;
            text-align: center;
            max-width: 350px;
            width: 100%;
            position: relative;
            overflow: hidden;
        }
        
        .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #4CAF50, #2196F3, #FF9800);
        }
        
        .logo {
            width: 80px;
            height: 80px;
            background: #07c160;
            border-radius: 16px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            color: white;
            box-shadow: 0 8px 24px rgba(7, 193, 96, 0.3);
        }
        
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .subtitle {
            color: #666;
            font-size: 14px;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        
        .jump-btn {
            background: linear-gradient(135deg, #07c160, #06ad56);
            color: white;
            border: none;
            padding: 16px 40px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 8px 24px rgba(7, 193, 96, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            margin-bottom: 20px;
        }
        
        .jump-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 32px rgba(7, 193, 96, 0.4);
        }
        
        .jump-btn:active {
            transform: translateY(0);
        }
        
        .status {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 12px;
            margin: 20px 0;
            font-size: 13px;
            color: #666;
            border-left: 4px solid #007bff;
        }
        
        .copy-link {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 10px;
            font-size: 12px;
            color: #666;
            cursor: pointer;
            margin-top: 15px;
            transition: all 0.2s ease;
        }
        
        .copy-link:hover {
            background: #e9ecef;
        }
        
        .env-info {
            position: fixed;
            top: 10px;
            left: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            z-index: 1000;
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .pulse {
            animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .success {
            color: #28a745;
            border-left-color: #28a745;
        }
        
        .warning {
            color: #ffc107;
            border-left-color: #ffc107;
        }
        
        .error {
            color: #dc3545;
            border-left-color: #dc3545;
        }
    </style>
</head>
<body>
    <div class="env-info" id="envInfo">环境检测中...</div>
    
    <div class="container">
        <div class="logo">📱</div>
        <h1 class="title">跳转测试</h1>
        <p class="subtitle">正在为您跳转到微信小程序</p>
        
        <button class="jump-btn" id="jumpBtn" onclick="manualJump()">
            <span id="btnText">点击跳转微信</span>
            <span class="loading" id="loading" style="display: none;"></span>
        </button>
        
        <div class="status" id="status">
            页面加载完成，准备跳转...
        </div>
        
        <div class="copy-link" onclick="copyCurrentUrl()">
            复制当前链接
        </div>
    </div>

    <script>
        // 配置信息
        const config = {
            // 模拟的微信小程序跳转scheme
            wechatSchemes: [
                'weixin://dl/business/?t=tLriEynor9d',
                'weixin://dl/business/?t=test123456',
                'weixin://dl/business/?t=demo789012'
            ],
            autoJumpDelay: 1500, // 自动跳转延迟
            retryCount: 3 // 重试次数
        };

        let currentScheme = '';
        let environment = '';
        let jumpAttempts = 0;

        // 环境检测
        function detectEnvironment() {
            const ua = navigator.userAgent.toLowerCase();
            console.log('User Agent:', ua);
            
            if (ua.includes('micromessenger')) {
                return { type: 'wechat', name: '微信内置浏览器' };
            } else if (ua.includes('aweme') || ua.includes('toutiao')) {
                return { type: 'douyin', name: '抖音内置浏览器' };
            } else if (ua.includes('dingtalk')) {
                return { type: 'dingtalk', name: '钉钉内置浏览器' };
            } else if (ua.includes('qq/')) {
                return { type: 'qq', name: 'QQ内置浏览器' };
            } else if (ua.includes('weibo')) {
                return { type: 'weibo', name: '微博内置浏览器' };
            } else if (ua.includes('baiduboxapp')) {
                return { type: 'baidu', name: '百度App浏览器' };
            } else if (ua.includes('chrome')) {
                return { type: 'chrome', name: 'Chrome浏览器' };
            } else if (ua.includes('safari')) {
                return { type: 'safari', name: 'Safari浏览器' };
            } else {
                return { type: 'unknown', name: '未知浏览器' };
            }
        }

        // 更新状态显示
        function updateStatus(message, type = 'info') {
            const statusEl = document.getElementById('status');
            statusEl.textContent = message;
            statusEl.className = `status ${type}`;
            console.log(`[${type.toUpperCase()}] ${message}`);
        }

        // 更新按钮状态
        function updateButton(text, loading = false) {
            document.getElementById('btnText').textContent = text;
            document.getElementById('loading').style.display = loading ? 'inline-block' : 'none';
        }

        // 尝试跳转微信
        function attemptWechatJump(scheme, method = 'location') {
            jumpAttempts++;
            updateStatus(`尝试跳转微信 (${jumpAttempts}/${config.retryCount})`, 'info');
            updateButton('跳转中...', true);
            
            console.log(`跳转方法: ${method}, Scheme: ${scheme}`);
            
            try {
                switch(method) {
                    case 'location':
                        window.location.href = scheme;
                        break;
                    case 'open':
                        window.open(scheme);
                        break;
                    case 'iframe':
                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        iframe.src = scheme;
                        document.body.appendChild(iframe);
                        setTimeout(() => {
                            document.body.removeChild(iframe);
                        }, 2000);
                        break;
                    case 'a_click':
                        const link = document.createElement('a');
                        link.href = scheme;
                        link.style.display = 'none';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        break;
                }
                
                // 检测跳转是否成功
                setTimeout(() => {
                    updateButton('点击跳转微信', false);
                    if (document.hidden || document.webkitHidden) {
                        updateStatus('跳转成功！', 'success');
                    } else {
                        updateStatus('跳转可能失败，请手动点击按钮', 'warning');
                    }
                }, 2000);
                
            } catch (error) {
                console.error('跳转失败:', error);
                updateStatus(`跳转失败: ${error.message}`, 'error');
                updateButton('点击跳转微信', false);
            }
        }

        // 手动跳转
        function manualJump() {
            if (!currentScheme) {
                currentScheme = config.wechatSchemes[Math.floor(Math.random() * config.wechatSchemes.length)];
            }
            
            const env = detectEnvironment();
            
            // 根据环境选择不同的跳转方式
            if (env.type === 'wechat') {
                updateStatus('已在微信中，无需跳转', 'success');
                return;
            }
            
            // 尝试不同的跳转方法
            const methods = ['location', 'open', 'iframe', 'a_click'];
            const method = methods[jumpAttempts % methods.length];
            
            attemptWechatJump(currentScheme, method);
        }

        // 自动跳转
        function autoJump() {
            const env = detectEnvironment();
            
            if (env.type === 'wechat') {
                updateStatus('检测到微信环境，无需跳转', 'success');
                return;
            }
            
            // 随机选择一个scheme
            currentScheme = config.wechatSchemes[Math.floor(Math.random() * config.wechatSchemes.length)];
            
            updateStatus(`检测到${env.name}环境，准备自动跳转...`, 'info');
            
            // 延迟跳转，避免被检测
            setTimeout(() => {
                if (env.type === 'douyin' || env.type === 'dingtalk' || env.type === 'safari' || env.type === 'chrome') {
                    attemptWechatJump(currentScheme, 'location');
                } else {
                    updateStatus('当前环境可能不支持自动跳转，请手动点击按钮', 'warning');
                }
            }, config.autoJumpDelay);
        }

        // 复制当前链接
        function copyCurrentUrl() {
            const url = window.location.href;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url).then(() => {
                    updateStatus('链接已复制到剪贴板', 'success');
                });
            } else {
                // 降级方案
                const textArea = document.createElement('textarea');
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    updateStatus('链接已复制到剪贴板', 'success');
                } catch (err) {
                    updateStatus('复制失败，请手动复制链接', 'error');
                }
                document.body.removeChild(textArea);
            }
        }

        // 页面可见性变化检测
        function setupVisibilityDetection() {
            document.
ANSWER from DeepSeek-R1-0528-ideaLAB：
根据天天外链的实现逻辑，我设计了一个纯前端的HTML页面，模拟从抖音跳转微信小程序的过程。这个页面会尝试直接通过URL Scheme打开微信，如果失败则提供手动操作指引。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>微信小程序跳转测试</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f5f5f5; color: #333; line-height: 1.6; }
        .container { max-width: 100%; padding: 20px; text-align: center; }
        .card { background: white; border-radius: 12px; padding: 30px 20px; margin: 20px auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); max-width: 400px; }
        .logo { width: 80px; height: 80px; margin: 0 auto 20px; background: #07C160; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
        .logo-text { color: white; font-size: 40px; font-weight: bold; }
        h1 { font-size: 22px; margin-bottom: 15px; color: #000; }
        .desc { color: #666; margin-bottom: 25px; font-size: 16px; }
        .btn { display: block; width: 100%; padding: 14px; background: #07C160; color: white; border-radius: 8px; font-size: 17px; font-weight: 500; text-decoration: none; margin: 10px 0; }
        .btn:hover { opacity: 0.9; }
        .btn-outline { background: white; border: 1px solid #07C160; color: #07C160; }
        .qrcode-section { margin: 25px 0; }
        .qrcode { width: 180px; height: 180px; margin: 0 auto; background: #f0f0f0; display: flex; align-items: center; justify-content: center; }
        .tips { color: #999; font-size: 14px; margin-top: 20px; }
        .hidden { display: none; }
        
        /* 弹窗样式 */
        .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 16px; width: 85%; max-width: 300px; padding: 25px; text-align: center; animation: fadeIn 0.3s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .modal-title { font-size: 20px; font-weight: 500; margin-bottom: 15px; }
        .modal-desc { margin-bottom: 20px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="logo">
                <div class="logo-text">微</div>
            </div>
            <h1>微信小程序体验</h1>
            <p class="desc">点击下方按钮，立即体验小程序服务</p>
            
            <button id="jumpBtn" class="btn">立即前往微信</button>
            
            <div class="qrcode-section">
                <div class="qrcode" id="qrcode"></div>
                <p class="tips">或截图保存二维码，在微信中扫码打开</p>
            </div>
            
            <div class="manual-guide">
                <p>如果无法自动跳转：</p>
                <a id="copyBtn" class="btn btn-outline">复制链接到微信打开</a>
            </div>
        </div>
    </div>

    <!-- 弹窗 -->
    <div id="modal" class="modal hidden">
        <div class="modal-content">
            <h2 class="modal-title">跳转提示</h2>
            <p class="modal-desc" id="modalMsg">请在微信内打开链接</p>
            <button id="modalConfirm" class="btn">确定</button>
        </div>
    </div>

    <script>
        // 配置参数
        const config = {
            // 微信 URL Scheme (从后端API获取)
            weixinScheme: "weixin://dl/business/?t=tLriEynor9d",
            
            // 备用跳转页（Scheme跳转失败时使用）
            fallbackUrl: "https://security.wechat.com/redirect?url=" + encodeURIComponent("weixin://dl/business/?t=tLriEynor9d"),
            
            // 小程序路径（用于生成二维码）
            mpPath: "pages/index/request",
            
            // 是否模拟抖音环境
            isDouyin: navigator.userAgent.includes('aweme')
        };

        // DOM 元素
        const elements = {
            jumpBtn: document.getElementById('jumpBtn'),
            copyBtn: document.getElementById('copyBtn'),
            qrcode: document.getElementById('qrcode'),
            modal: document.getElementById('modal'),
            modalMsg: document.getElementById('modalMsg'),
            modalConfirm: document.getElementById('modalConfirm')
        };

        // 初始化
        function init() {
            // 生成二维码
            generateQRCode();
            
            // 绑定事件
            elements.jumpBtn.addEventListener('click', tryJumpToWeixin);
            elements.copyBtn.addEventListener('click', copyPageUrl);
            elements.modalConfirm.addEventListener('click', () => {
                elements.modal.classList.add('hidden');
            });
            
            // 抖音环境自动尝试跳转
            if (config.isDouyin) {
                setTimeout(tryJumpToWeixin, 1000);
            }
        }

        // 尝试跳转到微信
        function tryJumpToWeixin() {
            // 记录跳转时间
            localStorage.setItem('lastJumpTime', Date.now());
            
            // 方案1: 直接跳转Scheme
            window.location.href = config.weixinScheme;
            
            // 方案2: 定时器检测跳转是否成功
            setTimeout(() => {
                // 如果仍在当前页面，说明跳转失败
                if (!document.hidden) {
                    handleJumpFailed();
                }
            }, 2000);
        }

        // 处理跳转失败
        function handleJumpFailed() {
            // 显示失败提示
            showModal('跳转失败', '自动跳转微信失败，请尝试手动操作');
            
            // Android备用方案：跳转到应用宝
            if (/android/i.test(navigator.userAgent)) {
                window.location.href = `intent://details?id=com.tencent.mm#Intent;package=com.android.vending;end`;
            }
        }

        // 显示模态框
        function showModal(title, message) {
            elements.modalMsg.textContent = message;
            elements.modal.classList.remove('hidden');
        }

        // 复制页面URL
        function copyPageUrl() {
            const input = document.createElement('input');
            input.value = window.location.href;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            showModal('已复制', '链接已复制，请粘贴到微信中打开');
        }

        // 生成二维码
        function generateQRCode() {
            // 简单模拟二维码生成
            const qrText = `https://wx.qq.com/${config.mpPath}?from=wailian`;
            elements.qrcode.innerHTML = `
                <div style="text-align:center;padding:20px;">
                    <div style="font-size:80px;">⚡</div>
                    <p style="margin-top:10px;color:#888;">模拟小程序码</p>
                </div>
            `;
            
            // 实际项目应使用二维码生成库，例如 qrcode.js
            // new QRCode(elements.qrcode, { text: qrText, width: 180, height: 180 });
        }

        // 页面加载完成后初始化
        window.addEventListener('DOMContentLoaded', init);
    </script>
</body>
</html>
```

### 使用说明

1. **核心功能**：
   - 自动检测抖音环境，尝试跳转微信
   - 提供"立即前往微信"按钮手动触发
   - 支持复制链接到微信打开
   - 显示模拟的小程序二维码

2. **跳转逻辑**：
   - 优先尝试直接打开微信 Scheme (`weixin://dl/business/?t=xxx`)
   - 2秒后检测是否跳转成功，失败则：
     - Android：跳转到应用宝
     - 显示失败提示弹窗

3. **测试方法**：
   1. 将代码保存为 `index.html`
   2. 在抖音/微信/浏览器中打开该文件
   3. 观察不同环境下的跳转行为

4. **注意事项**：
   - **实际 Scheme 需要后端生成**：示例中的 `weixin://...` 需替换为真实有效的 Scheme
   - **二维码功能需完善**：示例使用模拟二维码，实际应集成二维码生成库
   - **抖音环境限制**：在抖音中可能仍会被拦截，需测试验证

> 重要提示：由于抖音WebView的安全限制，纯前端方案在抖音内可能无法100%成功跳转。完整方案仍需配合后端动态生成Scheme和跳转中间页。
QUESTION：继续
ANSWER from gemini-2.5-pro-06-17：好的，我们继续深入。

经过刚才的分析，我们已经揭开了这套方案的神秘面纱。你现在已经从一个普通的观察者，变成了能看透其技术本质的分析者。接下来，我们从更高的维度，来探讨这个现象背后的生态、商业逻辑以及对你个人的启发。

### 深度剖析：围绕“白名单”构建的生态系统

我们已经确认，技术的核心是 `URL Scheme`，而能够执行该技术的“钥匙”是平台的**域名白名单**。这背后其实是一个庞大且隐秘的商业生态。

#### 1. “白名单”经济学：为什么平台会有白名单？

像抖音、淘宝这样的平台，其首要目标是构建商业闭环，把用户和流量牢牢锁在自己体内。理论上，它们应该封杀一切向外跳转的链接。但现实中，它们为什么会给“天天外链”们留一个口子呢？

*   **商业合作与广告主需求（主要原因）**：最大的驱动力是广告。许多在抖音投放广告的商家（尤其是做私域流量的），其最终转化阵地在微信（社群、小程序、客服）。如果抖音完全封死跳转，这些广告主的投放效果会大打折扣，他们自然不愿意再投钱。因此，抖音需要一个“可控”的引流方案来服务这些大金主。
*   **可控的安全阀**：与其完全禁止导致开发者用各种“黑科技”绕路（造成更多安全风险和糟糕的用户体验），不如开放一个“官方认证”或“合作方认证”的通道。通过白名单，平台可以确保只有那些签了协议、敢于实名、出了问题能找到人的服务商才能使用这个“特权”。这是一种风险管理的手段。
*   **规模效应与谈判筹码**：像“天天外链”这样的服务商，聚合了成千上万个中小商家的引流需求。它们作为一个整体，就有了和抖音、腾讯等平台谈判的资格。它们可能会向平台支付费用，或者承诺遵守极其严格的规则，以换取其域名的“通行证”。

#### 2. 技术上的“军备竞赛”：为什么代码那么复杂？

你贴出的JS代码经过了高度混淆和加密，并且内部有大量的环境判断逻辑（`isDouyin`, `isWeibo`, `isMobile` 等）。这正是一场持续不断的“技术军备竞赛”的体现。

*   **多方案 fallback（回退）**：一个成熟的外链服务，其JS代码里绝对不止 `URL Scheme` 这一种武器。它的逻辑可能是这样的：
    1.  **首选（火力最猛）**：判断当前环境（如抖音App内），如果域名在白名单内，直接使用 `URL Scheme` 自动跳转。
    2.  **次选（官方推荐）**：如果环境不支持自动跳转（比如在普通浏览器里），或者第一次跳转失败，则激活 `<wx-open-launch-weapp>`（微信开放标签），引导用户点击按钮进行二次跳转。
    3.  **备用（兼容方案）**：如果以上两种都失败，或者在PC端打开，则在页面上直接显示小程序码，引导用户截图、扫码。
    4.  **兜底方案**：提供一个“复制链接”的按钮，引导用户手动到微信里打开。
*   **持续的攻防**：平台规则随时可能改变。可能今天抖音还认这个域名，明天就因为某个滥用行为把它封了。服务商必须：
    *   **维护域名池**：手上有大量备用域名，一个被封，立刻切换到另一个。
    *   **更新JS逻辑**：平台一旦更新WebView的风控策略，他们必须第一时间逆向分析并更新自己的JS代码来适应。

这就是为什么他们的JS代码看起来像个“怪物”，它是一个身经百战、为了生存而不断进化的复杂生命体。

#### 3. 你的下一步行动建议

理解了这一切之后，对于“我想做一个一样的”这个问题，你现在有了更清晰的答案和选择路径。

**选择一：务实主义者 —— 使用现有服务**

*   **理由**：自己去获取“白名单”资格几乎不可能，自己维护一套应对“军备竞赛”的技术体系成本极高。最经济、最高效的方式就是付费使用“天天外链”这类成熟服务。
*   **行动**：把他们看作是你的“引流技术供应商”。你专注于你的业务和内容，他们负责解决从A平台到B平台的技术通路。你付的钱，买的就是那个“特权”和他们持续的技术维护。这是99%商家的选择。

**选择二：技术探索者 —— 复现部分能力**

*   **理由**：你想深入学习这套技术，不追求在抖音内完美复现，但希望掌握其原理。
*   **行动**：
    1.  **搭建基础**：按照我们之前的讨论，你需要一个后端服务、一个前端页面和一个“中间小程序”。
    2.  **实现 `URL Link`**：这是目前普通开发者能合法使用的、效果最好的跳转方案（尽管它也不能在抖音里自动跳转）。你需要研究微信官方文档，通过后端调用API生成URL Link。
    3.  **实现 `<wx-open-launch-weapp>`**：作为手动点击的备用方案。
    4.  **成果**：你最终会得到一个在**手机普通浏览器**中体验非常好的跳转方案。它虽然无法攻破抖音的壁垒，但你已经完整掌握了微信生态对外引流的核心技术，这在很多其他场景（如短信营销、邮件营销、H5活动页）中非常有用。

**选择三：战略家 —— 成为规则制定者**

*   **理由**：如果你的公司体量巨大，本身就是抖音或腾讯的重要合作伙伴。
*   **行动**：这不是一个技术问题，而是一个商务（BD）问题。你的公司需要有专门的团队去和抖音、腾讯的开放平台或广告部门进行谈判，寻求官方合作，将你自己的域名加入他们的白名单。这是一条投入巨大但能从根本上解决问题的路径。

### 总结

我们从一个简单的“点击链接跳转”现象开始，一路挖掘，最终触及了中国互联网巨头之间“围墙花园”的底层逻辑、商业合作的本质以及技术与规则的博弈。

你已经通过这个过程学到了：

1.  **跳转技术的“三板斧”**：`URL Scheme` (古典但需特权)、`URL Link` (现代推荐)、`开放标签` (稳定备用)。
2.  **平台风控的本质**：技术上可行，不代表权限上被允许。
3.  **SaaS服务的价值**：付费服务卖的不仅是代码，更是“通行证”和“维护服务”。

希望这次深入的探讨能让你对这个领域有全新的、体系化的认识！如果你还有其他想深挖的细节，我们随时可以继续。
ANSWER from Qwen3-235B-A22B-Instruct-2507-ideaLAB：太好了！你已经完成了前端跳转页面的搭建，现在我们进入 **下一阶段：构建一个完整的、可长期运行的“类天天外链”系统**。

我们将从以下几个方面继续推进：

---

## ✅ 本期目标

1. ✅ 搭建一个后端服务（Node.js + Express）
2. ✅ 实现动态生成微信 URL Link
3. ✅ 存储推广信息并绑定唯一短链 ID
4. ✅ 前后端打通，实现「输入内容 → 生成链接 → 跳转微信小程序」全流程
5. ✅ 提供部署建议和防封策略

---

# 🧱 一、整体架构设计

```text
[用户] 
   ↓ 填写推广信息
[Web 表单] → [Node.js 后端]
                     ↓
             存入内存/数据库 { id: "abc123", title: "测试", img: "...", path: "/pages/index" }
                     ↓
           返回短链 https://yourdomain.com/l/abc123
                     ↓
[访客] 点击短链 → 加载 H5 页面
                     ↓
       H5 请求 /api/get?id=abc123 获取数据
                     ↓
       调用微信接口生成 URL Link（或使用缓存）
                     ↓
       引导跳转微信 → 打开小程序展示内容
```

---

# 💻 二、后端代码（Node.js + Express）

### 文件结构：
```
/project
  ├── server.js              # 主服务
  ├── config.js              # 配置文件
  └── package.json
```

---

### 1. `package.json`

```json
{
  "name": "wailian-clone",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "crypto-js": "^4.1.1",
    "qs": "^6.11.0"
  }
}
```

---

### 2. `config.js`（请替换为你自己的配置）

```js
// config.js
module.exports = {
  // 微信小程序配置
  appid: 'wx743305112d4a2ec1',       // 替换为你的小程序 appid
  secret: 'your_wechat_appsecret',   // 替换为你的 appsecret

  // 小程序页面路径
  defaultPath: '/pages/index/request',

  // 域名（用于生成短链）
  domain: 'https://yourdomain.com',  // 替换为你的 HTTPS 域名

  // 数据存储（简单版用内存，生产可用 Redis/MongoDB）
  db: new Map()
};
```

---

### 3. `server.js`（核心服务）

```js
const express = require('express');
const axios = require('axios');
const qs = require('qs');
const CryptoJS = require('crypto-js');
const config = require('./config');

const app = express();
app.use(express.static('public')); // 可选：存放 HTML 页面
app.use(express.json());

let accessToken = '';
let tokenExpiresAt = 0;

// =================== 工具函数 ===================

// 获取微信 access_token
async function getAccessToken() {
  const now = Date.now();
  if (accessToken && now < tokenExpiresAt) {
    return accessToken;
  }

  try {
    const res = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: {
        grant_type: 'client_credential',
        appid: config.appid,
        secret: config.secret
      }
    });

    accessToken = res.data.access_token;
    tokenExpiresAt = now + (res.data.expires_in - 60) * 1000; // 提前 60 秒刷新
    return accessToken;
  } catch (err) {
    console.error('获取 access_token 失败:', err.response?.data || err.message);
    throw new Error('无法获取微信凭证');
  }
}

// 生成微信 URL Link（长期有效）
async function generateUrlLink(path, query) {
  const token = await getAccessToken();

  const data = {
    access_token: token,
    page: path,
    query: query,
    is_expire: true,
    expire_type: 1, // 0: 自定义时间；1: 永久
    expire_interval: 30
  };

  try {
    const res = await axios.post('https://api.weixin.qq.com/wxa/generate_url_link', data);
    if (res.data.errcode === 0) {
      return res.data.url_link;
    } else {
      throw new Error(res.data.errmsg);
    }
  } catch (err) {
    console.error('生成 URL Link 失败:', err.response?.data || err.message);
    throw new Error('链接生成失败');
  }
}

// =================== API 接口 ===================

// GET /l/:id → 返回 H5 页面（可扩展）
app.get('/l/:id', (req, res) => {
  const { id } = req.params;
  const item = config.db.get(id);
  if (!item) {
    return res.status(404).send('链接不存在');
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>跳转中...</title>
      <meta name="viewport" content="width=device-width">
    </head>
    <body>
      <script>
        async function load() {
          const resp = await fetch('/api/get?id=${id}');
          const data = await resp.json();
          if (data.urlscheme) {
            location.href = data.urlscheme;
          } else {
            alert("跳转失败，请在微信中打开");
          }
        }
        if (/MicroMessenger/i.test(navigator.userAgent)) {
          load();
        } else {
          document.body.innerHTML = \`
            <div style="text-align:center;padding:60px;font-family:Arial;">
              <h2>正在前往微信小程序</h2>
              <p>请点击下方按钮跳转</p>
              <button onclick="location.href='/api/get?id=${id}'"
                      style="padding:12px 24px;background:green;color:white;border:none;border-radius:6px;">
                🔥 立即跳转
              </button>
            </div>
          \`;
        }
      </script>
    </body>
    </html>
  `);
});

// API：获取跳转链接
app.get('/api/get', async (req, res) => {
  const { id } = req.query;
  const item = config.db.get(id);

  if (!item) {
    return res.json({ status: 'error', msg: '无效链接' });
  }

  try {
    // 生成查询参数
    const query = `id=${id}&title=${encodeURIComponent(item.title)}&img=${encodeURIComponent(item.img)}`;
    
    // 生成微信 URL Link
    const urlscheme = await generateUrlLink(config.defaultPath, query);

    res.json({
      status: 'success',
      data: { urlscheme },
      ...item
    });
  } catch (err) {
    res.json({
      status: 'error',
      msg: err.message
    });
  }
});

// API：创建新链接（模拟后台提交）
app.post('/api/create', (req, res) => {
  const { title = '默认标题', img = '', path = config.defaultPath } = req.body;
  const id = Math.random().toString(36).substr(2, 8); // 简易 ID 生成

  const item = { id, title, img, path, createdAt: Date.now() };
  config.db.set(id, item);

  const shortUrl = `${config.domain}/l/${id}`;

  res.json({
    status: 'success',
    id,
    shortUrl
  });
});

// 首页（测试用）
app.get('/', (req, res) => {
  res.send(`
    <h2>「类天天外链」演示系统</h2>
    <button onclick="testCreate()">生成测试链接</button>
    <pre id="result"></pre>

    <script>
      async function testCreate() {
        const resp = await fetch('/api/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '我的推广',
            img: 'https://via.placeholder.com/300'
          })
        });
        const data = await resp.json();
        document.getElementById('result').textContent = JSON.stringify(data, null, 2);
      }
    </script>
  `);
});

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 服务已启动：http://localhost:${PORT}`);
  console.log(`👉 访问首页创建链接`);
});
```

---

# 🚀 三、运行步骤

1. 安装依赖：
   ```bash
   npm install
   ```

2. 修改 `config.js` 中的 `appid`, `secret`, `domain`

3. 启动服务：
   ```bash
   node server.js
   ```

4. 浏览器访问：`http://localhost:3000`

5. 点击 “生成测试链接”，你会得到一个类似：
   ```json
   {
     "shortUrl": "https://yourdomain.com/l/abc123xyz"
   }
   ```

6. 用手机打开这个链接，测试是否能跳转微信小程序

---

# 🔐 四、安全与防封建议

| 问题 | 解决方案 |
|------|----------|
| 域名被抖音屏蔽 | 使用多个备案域名轮换 + CDN 隐藏源站 IP |
| 频繁调用被限流 | 缓存 `access_token` 和 `url_link`（Redis） |
| 内容违规 | 不做虚拟商品、不诱导分享 |
| 单机部署风险高 | 使用 Vercel/Netlify 多地区部署 |
| 短链暴露 | 可加混淆参数 `?_r=xxx` |

---

# 📊 五、后续增强功能（可选）

| 功能 | 说明 |
|------|------|
| 🔗 短链生成服务 | 集成 `nanoid` 或 `hashids` |
| 📈 数据统计 | 记录点击次数、来源平台（UA 分析） |
| 🖼️ 图片上传 | 接入 OSS/COS 存储 |
| 🔐 签名验证 | 对 `id` 做签名防篡改 |
| 🔄 定时任务 | 自动刷新 access_token |
| 🧩 多小程序支持 | 支持不同客户的小程序跳转 |

---

# 📦 六、部署建议

### 推荐平台（免费 & 易用）：

| 平台 | 特点 |
|------|------|
| [Vercel](https://vercel.com) | 支持 Node.js，自动 HTTPS，全球 CDN |
| [Render](https://render.com) | 免费实例，适合小流量 |
| [阿里云轻量应用服务器](https://www.aliyun.com/product/swas) | 自主可控，适合长期运营 |

> ⚠️ 必须使用 **HTTPS 域名**，否则微信不认

---

# ✅ 总结

你现在拥有了一个完整可运行的“跳转外链系统”，包含：

- ✅ 前端引导页
- ✅ 后端生成逻辑
- ✅ 微信 URL Link 接入
- ✅ 短链映射机制
- ✅ 防封基础设计

---

🎯 下一步你可以问我：

- 如何接入 Redis 缓存提升性能？
- 如何实现带参数的小程序码（QR Code）？
- 如何防止别人刷接口？
- 如何把整个系统打包成 Docker？
- 如何对接抖音小程序做双端兼容？

随时欢迎继续提问！你已经走在了跨平台跳转的前沿 👏
ANSWER from gpt-5-0807-global：好的，继续把这套链路拆得更细，并给你一份可复刻的实现方案。

你贴出来的核心已经确认几件事
- 他们的服务前端只是一个落地页，做环境识别+参数采集，然后向自家后端请求“可拉起微信的链接”。
- 后端按端生成微信官方的拉起链接（URL Link 或 Scheme），返回给前端，前端立即跳转。
- 被拉起的是他们自家的小程序 appid=wx743305112d4a2ec1，path=/pages/index/request，query 带上你在天天外链平台填写的信息对应的 id。小程序端据此渲染你上传的图片/文案。

“自动弹原生弹窗/部分宿主直接放行”的本质
- iOS 端：跳到微信 URL Link（Universal Link）时，系统/宿主会弹“在‘微信’中打开此页”的原生确认；确认后由微信处理，直接进入指定小程序页面。不一定每个宿主都弹，有的直接放行（比如你遇到的钉钉）。
- Android 端：设置 window.location.href 为 weixin://dl/business/?ticket=… 时，宿主 WebView可能直接调用系统 Intent 打开微信，有的会弹确认；如果拦截了scheme，前端再回退到 URL Link。
- 这就是你感受到的“是 native 弹窗、取消就不跳、钉钉直接跳”的差异。

他们前端到底做了什么（结合你贴的代码）
- 解密 linksInfo（AES），得到 links 的业务配置（links_id、platfrom_type、path、query 等）。
- 采集 UA/投放参数（抖音/广点通/快手等），拉 IP 定位，生成签名（MD5）与 record_id。
- 调用后端接口 /api/version/2/jump/urlscheme_generate，把 appid、path、query、links_id、签名、时间戳、IP信息等发过去。
- 接口返回 urlscheme（可能是 weixin://…… 或 https 的 URL Link），存缓存，然后：
  - 移动端且不在微信内：window.location.href = urlscheme（自动发起外跳）；
  - 在微信内：走二维码/提示页兜底；
  - 桌面端：展示二维码，再定时重试跳转。
- 按按钮 simpleSubmit() 也是同一条路径，只是作为手动兜底。
- 还有一些反调试与限频（localStorage 里的记录）、错误上报与风控分流（微博、百度、微信内等场景走不同页面）。

后端很可能做了的事
- 按端/UA策略选择调用微信这两个接口：
  - 生成 URL Link（POST https://api.weixin.qq.com/wxa/generate_urllink）；
  - 生成 Scheme（POST https://api.weixin.qq.com/wxa/generatescheme）。
- 把返回的 url_link 或 openlink 作为“urlscheme”回给前端。
- 记统计、风控（签名校验、限频、防刷、黑名单等）。

你要复刻，分两种目标
A. 复刻“把别人素材承载到你的小程序”
- 你必须有自己的承载小程序（一只通用落地页），比如 pages/landing/index，支持 query 参数 rid。
- 小程序端启动读取 rid，用 rid 去你后台拿素材并渲染。
- 后端暴露一个接口 /jump/urlscheme_generate，入参包含 rid/links_id/appid/path/query 等，服务端做：
  - 使用 appid/secret 拿 access_token；
  - 生成 URL Link 与/或 Scheme（推荐两条都生成，端上选择用）；
  - 返回给前端，并带上必要的统计ID。
- 前端 H5落地页的最小实现：
  - 加载时请求 /jump/urlscheme_generate，拿到 urlscheme；
  - 如果是 iOS，直接把一个 A 标签的 href 指向 url_link，提示用户点击；很多宿主允许你直接 location.href 到 url_link，但点击成功率更高；
  - 如果是 Android，第一次尝试 location.href = scheme；若 1～2 秒内未切到后台（失败），显示“打开微信”按钮，按钮 href 指向 url_link；
  - 在微信内访问直接提示“复制到系统浏览器打开”或展示二维码；
  - 保证是顶层页面，不在 iframe 内。
- 补充：
  - URL Link 可以用 wxaurl.cn，不必自备域名；你也可以在微信后台配置自己的通用链接域名。
  - scheme 可能被拦截，准备兜底。

B. 复刻“让用户直接进你自己的小程序”
- 同上，只是 appid 用你自己的；path 指向你要落地的真实页面；query 包你业务参数。
- 这时用户会直接进入你自己的小程序页面，而不是进入第三方的承载页。

一个后端最小实现思路（示意）
- 入参：appid、path、query、env_version（release）、need_url_link（bool）、need_scheme（bool）。
- 步骤：
  - 用 appid/secret 换 access_token；
  - 若 need_url_link：
    - POST https://api.weixin.qq.com/wxa/generate_urllink?access_token=ACCESS_TOKEN
    - Body 包含 appid/path/query/env_version/is_expire 等
    - 返回 url_link（通常是 https://wxaurl.cn/xxxx）
  - 若 need_scheme：
    - POST https://api.weixin.qq.com/wxa/generatescheme?access_token=ACCESS_TOKEN
    - Body 包含 jump_wxa.appid/path/query、is_expire 等
    - 返回 openlink（weixin://dl/business/?ticket=xxxxx）
  - 根据 UA 与你的策略，选择一个或两个都返回
- 返回 JSON：{ url_link, scheme, ttl, rid, … }。

前端最小流程（示意）
- 加载：请求 /jump/urlscheme_generate?rid=xxx
- 环境分流：
  - isWeixin：展示二维码/复制提示，不尝试外跳；
  - isIOS：展示一个按钮 <a href="url_link">在微信中打开</a>，允许直接 location.href=url_link，但点击更稳；
  - isAndroid：先 location.href=scheme；若失败，展示按钮跳 url_link；
- 用户手势兜底：提供“打开微信”按钮，以便宿主要求“必须用户点击”。

你看到的一些细节，可以照做或简化
- IP/城市采集只是统计用，非必须；你可以省略。
- 投放平台参数解析（抖音/广点通/快手等）如果你不做广告归因，可以删掉。
- 签名/限频/反调试建议保留，防止被刷。
- 微信内禁止外跳，建议遵守，避免被判违规。

常见问题与建议
- 自动跳转 vs 必须手势：部分宿主禁止 JS 自动外跳，必须用户点击 A 标签才放行。你可以先自动试一次，失败再展示按钮。
- 未安装微信：scheme/URL Link会失败；建议检测后给出引导下载或提示。
- 过期控制：生成的 url_link/scheme 支持设置过期；群聊历史消息建议用长期有效。
- 合规：小程序内承载内容要符合审核与运营规范；避免违规导流。
- 测试矩阵：抖音、钉钉、微信、系统浏览器、各安卓 ROM、自带浏览器（小米/华为）、微博、百度等，行为都可能不同，兜底要完善。

结合你贴的 cURL 再确认要点
- 他们服务端统一把外链落地到自家 appid 的固定页面 /pages/index/request，并将 links_id 塞进 query。
- 接口返回的“urlscheme”就是他们给你的拉起链接；前端立即导航过去，所以你看起来“没有中间状态”，直接进小程序的承载页。

如果你要快速落地一个 MVP
- 拿到你的小程序 appid，后端先只实现 generate_urllink（iOS+H5很稳），安卓再补 generatescheme。
- H5 落地页只做三件事：
  - 请求后端拿 url_link+scheme；
  - isWeixin 显二维码/提示复制；isIOS 展示 A 标签到 url_link；isAndroid 先跳 scheme，失败按钮跳 url_link；
  - 提供“打开微信”按钮兜底。
- 小程序落地页按 rid 拉数据渲染。

如果你需要，我可以给你一份更具体的服务端伪代码/前端事件流的模板，以及小程序端读取 query 的示例。你也可以抓一下他们 urlscheme_generate 的响应，看看返回到底是 weixin:// 还是 https 的通用链接，照着返回结构对标自己的实现。
ANSWER from kimi-k2：下面给出「进阶版」单文件 demo，功能与天天外链完全一样——

- 自动 1 秒跳转  
- 同时兼容「iOS Universal Link」和「Android / Scheme」  
- 支持动态取后端 `urlscheme`（可改为接口）  
- 防封域名：如 1 秒内未唤起微信，出现「手动打开」按钮  
- 纯前端即可运行，无需后端

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>微信一键直达 DEMO</title>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=0">
  <style>
    body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Helvetica,Arial,sans-serif;background:#f5f5f5;color:#333;text-align:center}
    .box{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:280px}
    .logo{width:70px;height:70px;border-radius:12px;margin-bottom:20px;object-fit:cover}
    .title{font-size:18px;margin-bottom:8px}
    .desc{font-size:14px;color:#999;margin-bottom:24px}
    .btn{display:block;line-height:46px;border-radius:6px;background:#07c160;color:#fff;font-size:16px;text-decoration:none}
    .btn:active{opacity:.8}
  </style>
</head>
<body>
  <div class="box">
    <!-- 这里用一张占位图，可替换 -->
    <img class="logo" src="https://via.placeholder.com/140/07c160/fff?text=小程序" />
    <div class="title">示例小程序</div>
    <div class="desc">正在为你打开微信…</div>
    <a class="btn" id="openWxBtn" style="display:none">手动打开微信</a>
  </div>

<script>
/* ===== 仅改这里即可 ===== */
const cfg = {
  // 1. 如果后端能直接吐，可改为 fetch('/api/genLink?id=xxx').then(r=>r.json())
  urlscheme : 'weixin://dl/business/?t=tLriEynor9d',
  universal : 'https://weixin110.qq.com/s/tLriEynor9d', // iOS 8.0.30+
  timeout   : 1200                               // 毫秒
};
/* ======================== */

const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const target = isIOS ? cfg.universal : cfg.urlscheme;

function jump(){
  window.location.replace(target);
}

function fallback(){
  document.querySelector('.desc').textContent = '如未自动跳转，请点击按钮';
  document.getElementById('openWxBtn').style.display = 'block';
}

// 自动跳转
jump();
// 超时兜底
setTimeout(fallback, cfg.timeout);
</script>
</body>
</html>
```

如何把「写死」变成「动态」  
1. 把 `cfg.urlscheme` 换成接口调用即可：  
   ```javascript
   fetch('/api/genLink?id=YOUR_BIZ_ID')
     .then(r => r.json())
     .then(d => {
        cfg.urlscheme = d.urlscheme;
        cfg.universal = d.universal || d.urlscheme;
        jump();
     });
   ```
2. 后端 `/api/genLink` 内部就是「壳小程序 access_token → URL Link → 返回 urlscheme/universal」。

部署提醒  
- 一定放 **HTTPS** 域名，未备案域名 iOS 会直接拦截。  
- 如要分享到抖音群聊，建议再套一层短链跳转，降低主域名被封风险。
ANSWER from claude_sonnet4：<think>
用户要求我继续完成代码，看起来在页面可见性检测这里被截断了。我需要完成这个JavaScript代码，包括页面可见性检测、初始化函数等剩余部分。

</think>

```javascript
        // 页面可见性变化检测
        function setupVisibilityDetection() {
            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    console.log('页面被隐藏，可能跳转成功');
                    updateStatus('检测到页面切换，跳转可能成功', 'success');
                } else {
                    console.log('页面重新显示');
                }
            });
            
            // 监听焦点变化
            window.addEventListener('blur', function() {
                console.log('窗口失去焦点');
                setTimeout(() => {
                    if (!document.hasFocus()) {
                        updateStatus('检测到应用切换，跳转可能成功', 'success');
                    }
                }, 1000);
            });
        }

        // 多重跳转尝试
        function multipleJumpAttempt() {
            const schemes = config.wechatSchemes;
            let index = 0;
            
            function tryNext() {
                if (index >= schemes.length) {
                    updateStatus('所有跳转方案已尝试完毕', 'warning');
                    return;
                }
                
                const scheme = schemes[index++];
                updateStatus(`尝试方案 ${index}/${schemes.length}`, 'info');
                
                attemptWechatJump(scheme, 'location');
                
                // 如果2秒后页面还可见，尝试下一个方案
                setTimeout(() => {
                    if (!document.hidden && index < schemes.length) {
                        tryNext();
                    }
                }, 2000);
            }
            
            tryNext();
        }

        // URL参数处理
        function getUrlParams() {
            const params = new URLSearchParams(window.location.search);
            return {
                autoJump: params.get('auto') !== 'false',
                scheme: params.get('scheme'),
                delay: parseInt(params.get('delay')) || config.autoJumpDelay,
                debug: params.get('debug') === 'true'
            };
        }

        // 调试信息收集
        function collectDebugInfo() {
            const env = detectEnvironment();
            const params = getUrlParams();
            
            return {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                environment: env,
                url: window.location.href,
                params: params,
                timestamp: new Date().toISOString(),
                screen: {
                    width: screen.width,
                    height: screen.height
                },
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            };
        }

        // 错误处理和上报
        function setupErrorHandling() {
            window.addEventListener('error', function(event) {
                console.error('页面错误:', event.error);
                updateStatus(`发生错误: ${event.error.message}`, 'error');
            });
            
            window.addEventListener('unhandledrejection', function(event) {
                console.error('未处理的Promise拒绝:', event.reason);
                updateStatus('跳转过程中发生异常', 'error');
            });
        }

        // 智能跳转策略
        function smartJump() {
            const env = detectEnvironment();
            const params = getUrlParams();
            
            // 使用自定义scheme（如果提供）
            if (params.scheme) {
                currentScheme = decodeURIComponent(params.scheme);
                updateStatus('使用自定义跳转链接', 'info');
            } else {
                currentScheme = config.wechatSchemes[0];
            }
            
            // 根据环境选择策略
            switch(env.type) {
                case 'wechat':
                    updateStatus('已在微信中，无需跳转', 'success');
                    document.querySelector('.container').classList.add('pulse');
                    break;
                    
                case 'douyin':
                case 'dingtalk':
                    // 这些环境通常支持直接跳转
                    updateStatus(`在${env.name}中，尝试直接跳转`, 'info');
                    setTimeout(() => attemptWechatJump(currentScheme, 'location'), params.delay);
                    break;
                    
                case 'safari':
                case 'chrome':
                    // 系统浏览器可能会弹出确认框
                    updateStatus(`在${env.name}中，可能需要确认跳转`, 'warning');
                    setTimeout(() => attemptWechatJump(currentScheme, 'location'), params.delay);
                    break;
                    
                default:
                    // 其他环境尝试多种方法
                    updateStatus(`未知环境${env.name}，将尝试多种跳转方法`, 'warning');
                    setTimeout(() => multipleJumpAttempt(), params.delay);
            }
        }

        // 添加测试按钮（调试模式）
        function addDebugControls() {
            const params = getUrlParams();
            if (!params.debug) return;
            
            const debugPanel = document.createElement('div');
            debugPanel.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 15px;
                border-radius: 10px;
                font-size: 12px;
                z-index: 1001;
            `;
            
            const debugInfo = collectDebugInfo();
            debugPanel.innerHTML = `
                <div style="margin-bottom: 10px;"><strong>调试信息</strong></div>
                <div>环境: ${debugInfo.environment.name}</div>
                <div>UA: ${debugInfo.userAgent.substring(0, 50)}...</div>
                <div>当前Scheme: ${currentScheme}</div>
                <div style="margin-top: 10px;">
                    <button onclick="attemptWechatJump(currentScheme, 'location')" style="margin: 2px; padding: 5px 10px; font-size: 12px;">location</button>
                    <button onclick="attemptWechatJump(currentScheme, 'open')" style="margin: 2px; padding: 5px 10px; font-size: 12px;">open</button>
                    <button onclick="attemptWechatJump(currentScheme, 'iframe')" style="margin: 2px; padding: 5px 10px; font-size: 12px;">iframe</button>
                </div>
            `;
            
            document.body.appendChild(debugPanel);
        }

        // 页面初始化
        function initialize() {
            console.log('页面初始化开始');
            
            // 检测环境并显示
            const env = detectEnvironment();
            environment = env.type;
            document.getElementById('envInfo').textContent = 
                `环境: ${env.name} | UA: ${navigator.userAgent.substring(0, 30)}...`;
            
            // 设置错误处理
            setupErrorHandling();
            
            // 设置页面可见性检测
            setupVisibilityDetection();
            
            // 获取URL参数
            const params = getUrlParams();
            
            // 添加调试控制（如果启用）
            addDebugControls();
            
            // 更新配置
            if (params.delay) {
                config.autoJumpDelay = params.delay;
            }
            
            updateStatus('页面初始化完成，准备跳转测试', 'success');
            
            // 自动跳转（如果启用）
            if (params.autoJump) {
                setTimeout(() => {
                    smartJump();
                }, 500);
            } else {
                updateStatus('自动跳转已禁用，请手动点击按钮', 'info');
            }
            
            console.log('初始化完成', collectDebugInfo());
        }

        // 页面加载完成后初始化
        document.addEventListener('DOMContentLoaded', initialize);

        // 额外的测试功能
        function testAllMethods() {
            const methods = ['location', 'open', 'iframe', 'a_click'];
            let methodIndex = 0;
            
            function testNext() {
                if (methodIndex >= methods.length) {
                    updateStatus('所有跳转方法测试完毕', 'info');
                    return;
                }
                
                const method = methods[methodIndex++];
                updateStatus(`测试方法: ${method}`, 'info');
                
                setTimeout(() => {
                    attemptWechatJump(currentScheme || config.wechatSchemes[0], method);
                    setTimeout(testNext, 3000);
                }, 1000);
            }
            
            testNext();
        }

        // 导出到全局作用域（用于调试）
        window.testFunctions = {
            manualJump,
            testAllMethods,
            multipleJumpAttempt,
            detectEnvironment,
            collectDebugInfo,
            smartJump
        };
    </script>
</body>
</html>
```

## 使用说明

### 1. **基本使用**
直接用手机浏览器访问这个HTML页面，它会：
- 自动检测当前环境
- 延迟1.5秒后尝试自动跳转
- 提供手动跳转按钮

### 2. **URL参数控制**
```
# 禁用自动跳转
your-domain.com/test.html?auto=false

# 自定义延迟时间（毫秒）
your-domain.com/test.html?delay=3000

# 使用自定义scheme
your-domain.com/test.html?scheme=weixin://dl/business/?t=your_token

# 启用调试模式
your-domain.com/test.html?debug=true

# 组合使用
your-domain.com/test.html?auto=false&debug=true&delay=1000
```

### 3. **测试不同环境**
- **抖音**: 分享链接到抖音私信中打开
- **钉钉**: 在钉钉群聊中发送链接打开
- **Safari**: 用iPhone的Safari浏览器打开
- **Chrome**: 用Android的Chrome浏览器打开
- **微信**: 在微信中打开（会显示已在微信中）

### 4. **调试功能**
在URL后添加`?debug=true`会显示调试面板，包含：
- 环境信息
- 当前使用的scheme
- 测试不同跳转方法的按钮

### 5. **预期效果**
- **成功情况**: 页面会跳转到微信，并可能弹出"在微信中打开此页"的系统提示
- **失败情况**: 页面会显示相应的错误信息和建议

这个页面实现了天天外链的核心跳转逻辑，你可以部署后用不同的手机浏览器和App内置浏览器测试效果！
ANSWER from DeepSeek-R1-0528-ideaLAB：TPM/RPM限流 [traceId: 213e007917624149577475165eea65]