import type { Metadata } from 'next'
import './styles/globals.css'

export const metadata: Metadata = {
  title: 'AI Smart Browser — Chat with Any Webpage',
  description: 'Analyze, summarize, and chat with any webpage using AI. Extract emails, phones, tables, and save pages for later.',
  keywords: ['AI', 'browser', 'webpage analysis', 'summarize', 'chat with webpage'],
  openGraph: {
    title: 'AI Smart Browser',
    description: 'Chat with any webpage using AI',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
