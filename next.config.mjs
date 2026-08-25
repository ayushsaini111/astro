/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // Target explicit route paths (Next.js keys do NOT support wildcards like '/api/**/*')
  outputFileTracingIncludes: {
    '/api/kundali/generate': ['./node_modules/@fusionstrings/swisseph-wasi/**/*'],
    '/api/kundali/match': ['./node_modules/@fusionstrings/swisseph-wasi/**/*'],
  },

  turbopack: {
    root: "D:\\OryviaProjects\\astro",
  },

  serverExternalPackages: [
    "@fusionstrings/swisseph-wasi",
    "better-sqlite3",
    "node-cron",
  ],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "res.cloudinary.com", port: "", pathname: "/dl79knb0g/**" },
    ],
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Requested-With" },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = Array.isArray(config.externals)
        ? config.externals
        : config.externals
        ? [config.externals]
        : [];

      config.externals = [...externals, 'better-sqlite3', 'node-cron'];
    } else {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'better-sqlite3': false,
        'node-cron': false,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;