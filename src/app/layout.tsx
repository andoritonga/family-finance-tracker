import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'APBK Finansial — Pengeluaran Keluarga',
  description: 'Pencatatan dan Pengelolaan Anggaran Pengeluaran Belanja Keluarga',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="font-sans antialiased bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <div className="min-h-screen">
          <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
