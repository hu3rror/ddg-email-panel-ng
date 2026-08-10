# DDG Email Panel

Open source, unofficial panel for DuckDuckGo Email Protection. Deployed on Vercel.

Idea from [whatk233/ddg-email-panel](https://github.com/whatk233/ddg-email-panel), rebuilt from scratch with Next.js 15 App Router.

[中文](./README_zh-CN.md)

## Features

- **Multi-account.** Log in with multiple Duck Addresses, switch between them, manage them from one place.
- **Two login methods.** Access Token (reliable, no captcha) or OTP passphrase sent to your Duck Address.
- **Private Duck Addresses.** Generate a new private alias, copy it to your clipboard, keep a history of the last 10.
- **Alias history.** Every generated address is stored per account with a timestamp. Oldest entries drop off at 10.
- **Dark mode.** Toggle theme. Your choice is saved to localStorage.
- **i18n.** English, 中文 (Simplified) etc.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript, strict mode |
| UI | Tailwind CSS v4 |
| State | Jotai v2 (`atomWithStorage`) |
| Validation | Zod |
| API | Edge Runtime route handlers |
| Tests | Vitest + Testing Library |
| PWA | Service worker + manifest |
| Package manager | pnpm |

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm test` | Run tests (58 passing) |
| `pnpm test:watch` | Watch mode |

## Project structure

```
src/
├── app/
│   ├── account/          # Account management page
│   ├── api/              # Edge route handlers
│   │   └── alias/generate
│   │   └── auth/login
│   │   └── auth/loginlink
│   ├── email/            # Email dashboard (alias generation, history)
│   ├── login/            # Login form (OTP + Access Token)
│   ├── globals.css       # Design tokens, light/dark vars
│   ├── layout.tsx        # Root layout, theme init script
│   ├── manifest.ts       # PWA manifest
│   └── sw.ts             # Service worker
├── components/
│   ├── copy-button.tsx
│   ├── theme-toggle.tsx
│   └── layout/
│       ├── account-switcher.tsx
│       └── nav.tsx
├── core/
│   ├── constants.ts
│   ├── ddg/client.ts     # DuckDuckGo API client
│   ├── env.ts            # Commit SHA, Vercel env
│   ├── hooks/
│   │   ├── use-auth.ts   # Auth hook (sendOtp, verifyOtp, loginWithToken)
│   │   └── use-hydrated.ts
│   ├── schemas/auth.ts   # Zod schemas
│   └── store/account.ts  # Jotai atoms, pure store functions
├── i18n/
│   └── routing.ts
└── middleware.ts
messages/
├── en.json
├── zh-CN.json
└── ja-JP.json
```

## Domain glossary

Key terms:

- **Duck Address** — A `@duck.com` email address.
- **Main Duck Address** — Your primary `@duck.com` address, derived from your username.
- **Private Duck Address** — A generated private alias that forwards to your Main Duck Address.
- **Access Token** — An API token from DuckDuckGo for programmatic alias generation.
- **OTP** — A time-limited passphrase sent to your Duck Address for authentication.

## Known limitation

OTP email login (`POST /api/auth/loginlink`) hits a DuckDuckGo reCAPTCHA challenge (`"error": "rc"`) when the request comes from a server IP. Access Token login works reliably instead. The route handler surfaces this as a clear error message pointing users to the token login path.

## License

MIT