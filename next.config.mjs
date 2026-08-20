const nextConfig = {
  reactStrictMode: false,

  turbopack: {
    root: "D:\\OryviaProjects\\astro",
  },

  // Merge both external packages
  serverExternalPackages: [
    "@fusionstrings/swisseph-wasi",
    "better-sqlite3",
    "node-cron",  // ✅ ADD THIS
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
          { key: "Access-Control-Allow-Origin", value: "http://localhost:3000" },
          { key: "Access-Control-Allow-Origin", value: "https://receptionrantraa.vercel.app" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Requested-With" },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Keep better-sqlite3 as external on server — don't bundle native addon
      const externals = Array.isArray(config.externals)
        ? config.externals
        : config.externals
        ? [config.externals]
        : [];

      config.externals = [...externals, 'better-sqlite3', 'node-cron'];  // ✅ ADD node-cron HERE
    } else {
      // Prevent client bundle from trying to resolve Node-only modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'better-sqlite3': false,
        'node-cron': false,  // ✅ ADD THIS
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;