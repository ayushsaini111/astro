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
};

export default nextConfig;