import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ToastProvider } from '@/components/providers/toast-provider'
import { GlobalConfirmProvider } from '@/components/GlobalConfirmProvider'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
})

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
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" type="image/png" href="/cropped_circle_image.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
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
