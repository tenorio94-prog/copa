/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BUILD_ID: "build-" + Date.now().toString(36),
  },
}

export default nextConfig
