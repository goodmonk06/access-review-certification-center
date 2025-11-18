import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Access Review & Certification Center',
  description: 'Periodic access review and certification system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
