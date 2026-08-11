import type { Metadata } from 'next'
import './globals.css'
import { Nav } from '@/components/layout/nav'
import { HtmlLangSync } from '@/components/layout/html-lang-sync'
import { StoreProvider } from '@/components/layout/store-provider'

export const metadata: Metadata = {
  title: 'DDG Email Panel',
  description: 'Open source unofficial DuckDuckGo Email Protection panel.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

const themeInitScript = `
(function() {
  try {
    var theme = localStorage.getItem('ddg-theme');
    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}
})();
`

const swRegisterScript = `
(function() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js');
    });
  }
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: swRegisterScript }} />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <StoreProvider>
          <HtmlLangSync />
          <Nav />
          {children}
        </StoreProvider>
      </body>
    </html>
  )
}