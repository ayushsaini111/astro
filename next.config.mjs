/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // ✅ prevents double mount in dev

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      // Your specific Cloudinary account
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/dl79knb0g/**", // Your specific cloud name
      },
    ],
  },

  // ✅ Enable CORS for API routes
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "http://localhost:3000" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { 
            key: "Access-Control-Allow-Headers", 
            value: "Content-Type, Authorization, X-Requested-With" 
          },
        ],
      },
    ];
  },

};

export default nextConfig;