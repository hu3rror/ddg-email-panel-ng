# DDG Email Panel

Open source, unofficial panel for DuckDuckGo Email Protection. Deployed natively on Vercel.

> **⚠️ Archived — no longer maintained (as of 2026-10).** Alias generation from datacenter egress is blocked by DuckDuckGo at the transport layer; a workaround (real Chromium inside the server function) was prototyped successfully but not productized. Full investigation and how-to in [Known limitations](#known-limitations).

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

## Known limitations

### OTP login blocked on server IPs

OTP email login (`POST /api/auth/loginlink`) hits a DuckDuckGo reCAPTCHA challenge (`"error": "rc"`) when the request comes from a server IP. Access Token login works reliably instead. The route handler surfaces this as a clear error message pointing users to the token login path.

### Alias generation blocked by DuckDuckGo — root cause: transport-layer client fingerprinting

**TL;DR** — `POST /api/email/addresses` only succeeds from a real browser network stack. The block is client-side, not IP-side: the same proxy IP that generates addresses from a browser gets blocked from `curl`. No header set and no TLS-impersonation library fixes it.

Verified in 2026-10, always with a fake token (`401 {"error":"invalid_token"}` = the request reached DDG's auth layer = the bot gate was passed):

| Egress + client | Result |
|---|---|
| Residential IP + browser / real Chromium | 201 (generates an address) |
| Any tested egress + `curl` (even with the full browser header set copied) | 401 |
| Any tested egress + `curl_cffi`, all 44 impersonation profiles (chrome 99–150, safari, firefox, tor) | 401 |
| Any tested egress + real Chromium network stack (headless) | 401 ✅ gate passed |
| Vercel Edge (production) + server `fetch` | 500 "Failed to parse response" |
| Vercel Node (AWS) + server `fetch` | 500 "Failed to parse response" |
| Cloudflare Workers + server `fetch` | 401 ✅ gate passed |
| Vercel (AWS) + `@sparticuz/chromium` 153 headless shell | 401 ✅ gate passed |

The official extension's `fetchAlias()` sends only an `Authorization: Bearer` header — DDG's verdict is based on the TLS/HTTP-2 fingerprint of the underlying network stack, which the extension inherits from the browser. Server-side `fetch` (Node/undici) is always a non-browser stack and gets rejected.

**Working path (prototyped, not productized here):** run a real Chromium inside the Vercel Node function — `@sparticuz/chromium@153.0.0` (~70 MB) + `puppeteer-core@25` — and issue the request via `page.evaluate`. Measured on Vercel Hobby (2 GB, iad1): cold call ≈ 5.2 s inside the function (2.3 s decompress + launch + network); hot calls skip decompression (`/tmp` cached, 0 ms) but the network still dominates (~4–5 s). Recommended: warm the function on page load, cache the `executablePath` promise, override the UA (headless shell's default is `HeadlessChrome`), use `headless: 'shell'`.

Gotchas hit while prototyping: (1) Vercel function bundling conflicts with pnpm's symlinked `node_modules` (`EEXIST` on deploy) — install with npm instead, or handle symlinks in `includeFiles`; (2) `puppeteer-core` 25 is pure ESM — the route must be ESM (`.mjs`); `require()` crashes; (3) ship the compressed binary via `includeFiles: "node_modules/@sparticuz/chromium/bin/**"` in `vercel.json`.

Reproduce the fingerprinting tests with `scripts/check-ddg-egress.sh`, `scripts/check-ddg-engines.sh`, `scripts/test-ddg-copy-as-curl.sh` (token via `--token-file` or env, never on the command line).

## License

MIT
