import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'APBK Keluarga Micha',
  description: 'Anggaran Pengeluaran Belanja Keluarga',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
