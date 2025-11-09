import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ToastProvider } from '@/components/providers/toast-provider'
import { GlobalConfirmProvider } from '@/components/GlobalConfirmProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quản lý giao việc',
  description: 'Quản lý giao việc',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ToastProvider>
          <GlobalConfirmProvider>
            {children}
            <Analytics />
          </GlobalConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
