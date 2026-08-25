/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  serverExternalPackages: [
    "@fusionstrings/swisseph-wasi",
    "better-sqlite3",
    "node-cron",
  ],

  outputFileTracingIncludes: {
    "/api/kundali/generate": [
      "./node_modules/@fusionstrings/swisseph-wasi/esm/generated/**/*.wasm",
    ],
    "/**": [
      "./node_modules/@fusionstrings/swisseph-wasi/esm/generated/**/*.wasm",
    ],
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "https://new-rantraa.vercel.app" },
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
      config.externals = [...externals, "better-sqlite3", "node-cron"];
    } else {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "better-sqlite3": false,
        "node-cron": false,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;