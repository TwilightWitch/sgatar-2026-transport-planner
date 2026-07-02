import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /**
   * Public runtime constants baked into the client bundle at build time.
   *
   * `NEXT_PUBLIC_*` variables normally need to be present in the Docker build
   * environment to be inlined, but `.dockerignore` excludes `.env*` to prevent
   * secrets from being baked into the image.  Listing non-secret public values
   * here guarantees they survive regardless of the build environment.
   *
   * To override at build time, set the env var before running `npm run build`.
   */
  env: {
    NEXT_PUBLIC_WHATSAPP_INVITE_URL:
      process.env.NEXT_PUBLIC_WHATSAPP_INVITE_URL ??
      "https://chat.whatsapp.com/CsZMaARmJrtJkxaDEgWoyJ",
  },
};

export default nextConfig;
