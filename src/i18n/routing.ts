export const routing = {
  locales: [
    'en',
    'es',
    'fr',
    'de',
    'it',
    'pt-BR',
    'ru',
    'ko',
    'hi',
    'ar',
    'tr',
    'zh-CN',
    'zh-TW',
    'ja-JP',
  ],
  defaultLocale: 'en',
} as const

export type Locale = (typeof routing.locales)[number]