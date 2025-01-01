import '../public/tamagui.css'

import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { GeistSans } from 'geist/font/sans'
import { Providers } from '@/components/providers'
import Head from 'next/head'

export const metadata: Metadata = {
  title: 'anon.world',
  description: 'anon.world',
  icons: '/favicon.ico',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>
      <body className={GeistSans.className}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  )
}
