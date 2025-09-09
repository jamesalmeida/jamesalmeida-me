import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Arkham Ventures - Empowering Innovation Through Diverse Ventures',
  description: 'A holding company managing multiple projects in technology and innovation. We foster transformative ideas and build sustainable ventures.',
  keywords: 'holding company, technology, innovation, ventures, business',
  authors: [{ name: 'Arkham Ventures' }],
  creator: 'Arkham Ventures',
  publisher: 'Arkham Ventures',
  openGraph: {
    title: 'Arkham Ventures - Empowering Innovation Through Diverse Ventures',
    description: 'A holding company managing multiple projects in technology and innovation.',
    url: 'https://arkham.ventures',
    siteName: 'Arkham Ventures',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arkham Ventures - Empowering Innovation Through Diverse Ventures',
    description: 'A holding company managing multiple projects in technology and innovation.',
    creator: '@arkhamventures',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
