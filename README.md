# DDG Email Panel

Open source, unofficial panel for DuckDuckGo Email Protection. Deployed natively on Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhu3rror%2Fddg-email-panel-ng)

[中文](./README_zh-CN.md)

<img width="1673" height="999" alt="image" src="https://github.com/user-attachments/assets/3e5eb4a7-dedf-4386-8184-5b0ccd22506e" />
<img width="1673" height="999" alt="image" src="https://github.com/user-attachments/assets/bb1afb77-7b16-438d-a0dc-63680516f586" />

## Features

- **Multi-account.** Add multiple Duck Addresses, switch between them, and manage them all in one place.
- **Two login methods.** Access Token (reliable, no captcha) or OTP passphrase sent to your Duck Address.
- **Private Duck Addresses.** Generate a new private alias in one click, copy it to your clipboard, and keep a history of the last 10.
- **Alias history.** Every generated address is stored per account with a timestamp. The oldest entries drop off at 10.
- **Account management.** Rename or remove accounts, and see which one is active.
- **Smart landing page.** Already signed in? Visiting the root URL takes you straight to `/email` — no redundant login screen.
- **Dark mode.** Toggle theme and it's saved to localStorage.
- **i18n.** English, Español, Français, Deutsch, Italiano, Português (BR), Русский, 한국어, हिन्दी, العربية, Türkçe, 简体中文, 繁體中文, 日本語.
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

## How to Get a Duck Address & Access Token

Since DuckDuckGo limits registration and OTP login when requests originate from server IPs (e.g., Vercel), you must register your primary address officially and retrieve your Access Token beforehand.

1. **Install the official extension.** DuckDuckGo restricts access to the signup page. You must first install the official **DuckDuckGo Browser Extension** (available for Chrome, Firefox, Edge, Safari) or use the **DuckDuckGo Private Browser** (on mobile or Mac/Windows).
2. **Sign up officially.** With the extension active, navigate to [duckduckgo.com/email](https://duckduckgo.com/email) and follow the on-screen prompts to set up your primary `@duck.com` address.
3. **Retrieve your Access Token.**
   - Open your browser's Developer Tools (`F12` or `Ctrl+Shift+I` / `Cmd+Option+I`).
   - Go to the **Application** (or **Storage**) tab.
   - Expand **Local Storage** on the left and select `https://duckduckgo.com`.
   - Locate the key named `user`. Copy the value inside, or extract the `"access_token"` string (e.g., `hkbidcezaw...`).
4. **Log in to the panel.** Paste this Access Token into your deployed instance to bypass all captcha limitations and start managing your aliases.

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
