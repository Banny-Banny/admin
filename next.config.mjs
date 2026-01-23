import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Next가 workspace root를 잘못 잡아 (다른 lockfile 기준으로) 의존성 해석이 꼬이는 문제를 방지
    root: __dirname,
  },
  images: {
    // 외부 이미지 도메인 허용 (모든 도메인 허용)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // 또는 unoptimized를 사용하는 경우 설정 불필요하지만, 명시적으로 설정
    unoptimized: false,
  },
};

export default nextConfig;

