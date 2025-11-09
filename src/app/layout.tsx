import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'GondolApp - Gestión de Inventario PWA',
    template: '%s | GondolApp',
  },
  description:
    'Aplicación móvil offline-first para gestión de inventario de supermercados con escaneo de códigos de barras y sincronización inteligente',
  keywords: [
    'pwa',
    'inventario',
    'supermercado',
    'offline',
    'móvil',
    'escaneo',
    'códigos de barras',
    'gestión',
    'reposición',
  ],
  authors: [{ name: 'GondolApp Development Team' }],
  creator: 'GondolApp Team',
  publisher: 'GondolApp',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // PWA Configuration
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      {
        url: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/icons/safari-pinned-tab.svg',
        color: '#3B82F6',
      },
    ],
  },
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://gondolapp.vercel.app',
    siteName: 'GondolApp',
    title: 'GondolApp - Gestión de Inventario PWA',
    description:
      'PWA offline-first para gestión de inventario de supermercados',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'GondolApp - Gestión de Inventario',
      },
    ],
  },
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'GondolApp - Gestión de Inventario PWA',
    description:
      'PWA offline-first para gestión de inventario de supermercados',
    images: ['/images/twitter-card.png'],
    creator: '@gondolapp',
  },
  // PWA specific meta tags
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'GondolApp',
    'application-name': 'GondolApp',
    'msapplication-TileColor': '#3B82F6',
    'msapplication-config': '/icons/browserconfig.xml',
    'theme-color': '#3B82F6',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3B82F6' },
    { media: '(prefers-color-scheme: dark)', color: '#1E40AF' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />

        {/* Additional PWA meta tags */}
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-launch-640x1136.png"
        />

        {/* Prevent zoom on input focus in iOS */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background">
            <div className="safe-area-top" />
            <main className="pb-safe container mx-auto px-4">{children}</main>
            <div className="safe-area-bottom" />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
