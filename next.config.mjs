import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // The Next.js image-optimization endpoint (/_next/image) is not
    // supported out of the box by @opennextjs/cloudflare — it relies on
    // sharp which won't run in a Worker. Without this flag every <Image>
    // resolves to a 404, and the storefront silently ships broken
    // pictures. Both Unsplash (mock data) and Supabase Storage (admin
    // uploads) already serve images via their own CDNs with strong cache
    // headers and built-in WebP delivery, so loading the originals is
    // actually faster than proxying them through the Worker.
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'source.unsplash.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default withNextIntl(nextConfig);
