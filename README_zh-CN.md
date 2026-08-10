# DDG 邮箱面板

开源的 DuckDuckGo Email Protection 非官方面板，原生部署在 Vercel 上。

## 功能

- **多账户管理。** 用多个 Duck 邮箱地址登录，自由切换，集中管理。
- **两种登录方式。** Access Token（稳定、无需验证码）或发到 Duck 邮箱的一次性口令（OTP）。
- **私密 Duck 地址。** 一键生成新的私密别名，复制到剪贴板，并保留最近 10 条历史。
- **别名历史。** 每个账户单独记录生成的地址和时间戳，超过 10 条自动淘汰最旧的。
- **深色模式。** 一键切换主题，选择会保存在 localStorage。
- **国际化。** 支持英文、简体中文等等。

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

## 快速开始

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
| `pnpm test` | 运行测试（58 个全部通过） |
| `pnpm test:watch` | 监听模式 |

## 项目结构

```
src/
├── app/
│   ├── account/          # 账户管理页面
│   ├── api/              # Edge 路由处理器
│   │   └── alias/generate
│   │   └── auth/login
│   │   └── auth/loginlink
│   ├── email/            # 邮箱仪表板（别名生成、历史）
│   ├── login/            # 登录表单（OTP + Access Token）
│   ├── globals.css       # 设计令牌、明暗主题变量
│   ├── layout.tsx        # 根布局、主题初始化脚本
│   ├── manifest.ts       # PWA manifest
│   └── sw.ts             # Service Worker
├── components/
│   ├── copy-button.tsx
│   ├── theme-toggle.tsx
│   └── layout/
│       ├── account-switcher.tsx
│       └── nav.tsx
├── core/
│   ├── constants.ts
│   ├── ddg/client.ts     # DuckDuckGo API 客户端
│   ├── env.ts            # Commit SHA、Vercel 环境变量
│   ├── hooks/
│   │   ├── use-auth.ts   # 认证 Hook（sendOtp、verifyOtp、loginWithToken）
│   │   └── use-hydrated.ts
│   ├── schemas/auth.ts   # Zod 校验
│   └── store/account.ts  # Jotai atoms、纯函数状态操作
├── i18n/
│   └── routing.ts
└── middleware.ts
messages/
├── en.json
├── zh-CN.json
└── ja-JP.json
```

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