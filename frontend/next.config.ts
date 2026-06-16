import type { NextConfig } from "next";

const allowedOrigins = [
  "localhost:3000",
  "localhost:3001",
  "127.0.0.1:3000",
  "127.0.0.1:3001",
];

if (process.env.NEXT_OUTPUT_WSS_PROXY) {
  try {
    const domain = process.env.NEXT_OUTPUT_WSS_PROXY.replace(
      /^wss?:\/\//,
      "",
    ).split("/")[0];

    allowedOrigins.push(domain);
  } catch (e) {
    console.error("Erreur lors du parsing de NEXT_OUTPUT_WSS_PROXY", e);
  }
}

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },

  allowedDevOrigins: allowedOrigins,

  experimental: {
    serverActions: {
      allowedOrigins: allowedOrigins.map((origin) => origin.split(":")[0]),
    },
  },
};

export default nextConfig;
