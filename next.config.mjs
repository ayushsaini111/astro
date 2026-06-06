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
    ],
  },
};

export default nextConfig;