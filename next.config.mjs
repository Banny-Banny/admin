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
};

export default nextConfig;

