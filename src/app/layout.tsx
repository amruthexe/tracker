import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'RN Life Tracker',
  description: 'Track your React Native learning, gym, shifts, and daily habits over 30 days.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RN Tracker',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    title: 'RN Life Tracker',
    description: '30-Day React Native learning & life tracker',
  },
}

export const viewport: Viewport = {
  themeColor: '#EB4917',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="font-[family-name:var(--font-poppins)] antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}
