import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ffmpeg-installer resolves its platform binary via dynamic require at runtime;
  // keep it external so the bundler doesn't try (and fail) to statically resolve it.
  serverExternalPackages: ['@ffmpeg-installer/ffmpeg', '@react-pdf/renderer'],
  // The PDF route reads .ttf fonts at process.cwd()/src/lib/pdf/fonts. Vercel only
  // bundles traced code, not arbitrary data files — list them so they ship too.
  outputFileTracingIncludes: {
    'src/app/api/meetings/[id]/pdf/route': ['./src/lib/pdf/fonts/**'],
  },
};

export default nextConfig;
