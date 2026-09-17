import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer and mammoth do their heavy lifting on the server;
  // keep them out of the client bundle.
  serverExternalPackages: ["@react-pdf/renderer", "mammoth", "pdf-parse"],
};

export default nextConfig;
