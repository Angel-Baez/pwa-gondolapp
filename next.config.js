/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/, // Catch all external requests
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
    // Cache-First para assets estáticos
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 año
        },
      },
    },
    // Cache-First para imágenes
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-images',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        },
      },
    },
    // Network-First para catálogo de productos
    {
      urlPattern: /\/api\/products.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'products-api',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        },
        networkTimeoutSeconds: 5,
      },
    },
    // Cache-Only para listas del día (siempre local)
    {
      urlPattern: /\/api\/lists\/daily.*/i,
      handler: 'CacheOnly',
      options: {
        cacheName: 'daily-lists',
      },
    },
    // StaleWhileRevalidate para páginas de la app
    {
      urlPattern: /^https?:\/\/localhost:3000\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'app-pages',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
  ],
  buildExcludes: [/middleware-manifest\.json$/],
  publicExcludes: ['!robots.txt'],
});

const nextConfig = withPWA({
  // Enable experimental features
  experimental: {
    optimizeCss: true,
  },

  // Performance optimizations for mobile PWA
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // PWA Configuration headers
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=()',
          },
        ],
      },
      // Service Worker headers
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },

  // Image optimization for mobile
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [375, 414, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'GondolApp',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // Webpack configuration for PWA optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        dns: false,
        child_process: false,
        tls: false,
      };
    }
    return config;
  },
});

module.exports = nextConfig;
