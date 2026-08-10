import type { Metadata } from 'next'
import './globals.css'
import { Nav } from '@/components/layout/nav'

export const metadata: Metadata = {
  title: 'DDG Email Panel',
  description: 'Open source unofficial DuckDuckGo Email Protection panel.',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <Nav />
        {children}
      </body>
    </html>
  )
}