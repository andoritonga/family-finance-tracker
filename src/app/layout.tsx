import './globals.css';
import { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

export const viewport: Viewport = {
  themeColor: '#4F46E5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'APBK Finansial — Pengeluaran Keluarga',
  description: 'Pencatatan dan Pengelolaan Anggaran Pengeluaran Belanja Keluarga',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'APBK Finansial',
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="font-sans antialiased bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <ServiceWorkerRegister />
        <div className="min-h-screen">
          <main className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
