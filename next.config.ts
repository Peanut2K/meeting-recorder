import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ffmpeg-installer resolves its platform binary via dynamic require at runtime;
  // keep it external so the bundler doesn't try (and fail) to statically resolve it.
  serverExternalPackages: ['@ffmpeg-installer/ffmpeg'],
};

export default nextConfig;
