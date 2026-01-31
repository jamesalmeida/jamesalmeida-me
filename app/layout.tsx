import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'James Almeida - AI Consulting & Custom Software',
  description: 'AI consulting and custom software for teams that want clarity, speed, and measurable impact.',
  keywords: 'AI consulting, custom software, automation, product development, workshops',
  authors: [{ name: 'James Almeida' }],
  creator: 'James Almeida',
  publisher: 'James Almeida',
  openGraph: {
    title: 'James Almeida - AI Consulting & Custom Software',
    description: 'AI consulting and custom software for teams that want clarity, speed, and measurable impact.',
    url: 'https://jamesalmeida.me',
    siteName: 'James Almeida',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'James Almeida - AI Consulting & Custom Software',
    description: 'AI consulting and custom software for teams that want clarity, speed, and measurable impact.',
    creator: '@jamesalmeida',
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    } catch(e) {}
  })();
`,
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
