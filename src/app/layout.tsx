import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { AuthGuard } from '@/components/layout/AuthGuard'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = { title: 'MeetingAI', description: 'Record and summarize meetings' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthGuard />
        <Navbar />
        {children}
      </body>
    </html>
  )
}
