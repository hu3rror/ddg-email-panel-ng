# DDG 邮箱面板

开源的 DuckDuckGo Email Protection 非官方面板，原生部署在 Vercel 上。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhu3rror%2Fddg-email-panel-ng)

[English](./README.md)

<img width="1673" height="999" alt="image" src="https://github.com/user-attachments/assets/5469ff08-e1b6-4bd7-a036-80b467270ff9" />
<img width="1673" height="999" alt="image" src="https://github.com/user-attachments/assets/e650a25c-9fa6-4211-afd7-a9b189ba64ed" />

## 功能

- **多账户管理。** 添加多个 Duck 邮箱地址，自由切换，集中管理。
- **两种登录方式。** Access Token（稳定、无需验证码）或发到 Duck 邮箱的一次性口令（OTP）。
- **私密 Duck 地址。** 一键生成新的私密别名，复制到剪贴板，并保留最近 10 条历史。
- **别名历史。** 每个账户单独记录生成的地址和时间戳，超过 10 条自动淘汰最旧的。
- **账户管理。** 重命名或删除账户，随时查看当前活跃的是哪个。
- **智能着陆页。** 已登录用户访问首页直接跳转到 `/email`，不再看到多余的登录页面。
- **深色模式。** 一键切换主题，选择会保存在 localStorage。
- **国际化。** English, Español, Français, Deutsch, Italiano, Português (BR), Русский, 한국어, हिन्दी, العربية, Türkçe, 简体中文, 繁體中文, 日本語。
- **PWA。** 可安装到桌面，支持 Service Worker 和图标。

## 一键部署

最快的方式是点击上方的 Vercel 按钮。它会直接克隆仓库并部署一个新项目，无需任何配置——不需要设置环境变量。着陆页显示的 Commit SHA 会自动从 Vercel 构建环境中读取。

## 本地开发

```bash
pnpm install
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 常用命令

| 命令 | 作用 |
|---|---|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm start` | 启动生产服务器 |
| `pnpm test` | 运行测试 |
| `pnpm test:watch` | 监听模式 |

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js 15（App Router） |
| 语言 | TypeScript（严格模式） |
| UI | Tailwind CSS v4 |
| 状态 | Jotai v2（`atomWithStorage`） |
| 校验 | Zod |
| API | Edge Runtime 路由处理器 |
| 测试 | Vitest + Testing Library |
| PWA | Service Worker + manifest |
| 包管理器 | pnpm |

## 如何获取 Duck 邮箱和 Access Token

由于 DuckDuckGo 会对来自服务器 IP（如 Vercel）的注册和 OTP 登录请求触发人机验证，您需要先通过官方渠道完成注册并获取 Access Token。

1. **安装官方扩展。** DuckDuckGo 限制了注册页面的访问权限。在开始之前，您必须先安装官方的 **DuckDuckGo 浏览器扩展**（支持 Chrome, Firefox, Edge, Safari）或使用 **DuckDuckGo 隐私浏览器**（移动端或 Mac/Windows 客户端）。
2. **通过官方注册。** 启用扩展或浏览器后，访问 [duckduckgo.com/email](https://duckduckgo.com/email)，按照页面指引创建您的主 `@duck.com` 邮箱。
3. **获取 Access Token。**
   - 注册完成后，在当前浏览器页面按下 `F12` 打开开发者工具。
   - 切换到 **Application（应用）** 或 **Storage（存储）** 选项卡。
   - 在左侧展开 **Local Storage（本地存储）**，点击 `https://duckduckgo.com`。
   - 找到名为 `user` 的键，复制其值，或者提取其中 `"access_token"` 对应的字符串（形如 `hkbidcezaw...`）。
4. **导入面板。** 将该 Access Token 填入您部署的面板中，即可完美绕过验证码限制，开始管理您的邮箱别名。

## 术语表

常用术语：

- **Duck 地址** — 一个 `@duck.com` 邮箱地址。
- **主 Duck 地址** — 由用户名派生出的主 `@duck.com` 地址。
- **私密 Duck 地址** — 转发到主 Duck 地址的生成型私密别名。
- **Access Token** — 来自 DuckDuckGo 的 API 令牌，用于程序化生成别名。
- **OTP** — 发到 Duck 邮箱的一次性口令，用于认证。

## 已知限制

### OTP 登录在服务器 IP 下被阻断

当请求来自服务器 IP 时，OTP 邮箱登录（`POST /api/auth/loginlink`）会触发 DuckDuckGo 的 reCAPTCHA 验证（`"error": "rc"`）。Access Token 登录可以稳定绕过这一问题。路由处理器会把该错误转成清晰的提示，引导用户改用 Token 登录。

### 生成别名在服务器 IP 下被阻断

当请求来自服务器 IP（例如运行在数据中心的 Vercel Edge Function）时，生成私密 Duck 地址（`POST /api/email/addresses`）会被拒绝并返回 `403`。上游返回的是空的 `text/plain` 响应体，因此面板会提示 `Failed to parse response`。Token 本身是有效的——同样的请求从住宅 IP 发起就能成功。这是 DuckDuckGo 服务端的限流/风控，并非面板的 bug，无法通过代码修复。如果托管实例需要生成别名，请将面板部署到从住宅 IP 出网的环境（家庭服务器、NAS、家庭网络上的 Docker 等）。

## License

MIT
