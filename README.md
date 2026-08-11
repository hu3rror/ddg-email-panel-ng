# DDG Email Panel

Open source, unofficial panel for DuckDuckGo Email Protection. Deployed natively on Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhu3rror%2Fddg-email-panel-ng)

[中文](./README_zh-CN.md)

## Features

- **Multi-account.** Add multiple Duck Addresses, switch between them, and manage them all in one place.
- **Two login methods.** Access Token (reliable, no captcha) or OTP passphrase sent to your Duck Address.
- **Private Duck Addresses.** Generate a new private alias in one click, copy it to your clipboard, and keep a history of the last 10.
- **Alias history.** Every generated address is stored per account with a timestamp. The oldest entries drop off at 10.
- **Account management.** Rename or remove accounts, and see which one is active.
- **Smart landing page.** Already signed in? Visiting the root URL takes you straight to `/email` — no redundant login screen.
- **Dark mode.** Toggle theme and it's saved to localStorage.
- **i18n.** English, 简体中文, 日本語.
- **PWA.** Installable, with a service worker and app icons.

## One-click deploy

The fastest way to run your own instance is the Vercel button above. It clones the repo and deploys a new project with zero configuration — no environment variables are required. The commit SHA shown on the landing page is picked up automatically from Vercel's build environment.

## Local development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start the production server |
| `pnpm test` | Run the test suite |
| `pnpm test:watch` | Watch mode |

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