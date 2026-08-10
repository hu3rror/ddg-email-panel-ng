import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DDG Email Panel',
  description: 'Open source unofficial DuckDuckGo Email Protection panel.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col justify-between">
        {children}
      </body>
    </html>
  )
}