# DDG 邮箱面板

开源的 DuckDuckGo Email Protection 非官方面板，原生部署在 Vercel 上。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhu3rror%2Fddg-email-panel-ng)

[English](./README.md)

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

## 术语表

常用术语：

- **Duck 地址** — 一个 `@duck.com` 邮箱地址。
- **主 Duck 地址** — 由用户名派生出的主 `@duck.com` 地址。
- **私密 Duck 地址** — 转发到主 Duck 地址的生成型私密别名。
- **Access Token** — 来自 DuckDuckGo 的 API 令牌，用于程序化生成别名。
- **OTP** — 发到 Duck 邮箱的一次性口令，用于认证。

## 已知限制

OTP 邮箱登录（`POST /api/auth/loginlink`）在请求来自服务器 IP 时会触发 DuckDuckGo 的 reCAPTCHA 验证（`"error": "rc"`）。Access Token 登录可以稳定绕过这一问题。路由处理器会把该错误转成清晰的提示，引导用户改用 Token 登录。

## License

MIT