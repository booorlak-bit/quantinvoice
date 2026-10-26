import { existsSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// Central Icons (the OSDS icon set) install only with CENTRAL_LICENSE_KEY. Without the package, `central-icons`
// resolves to local stand-ins with the same names.
const hasCentralIcons = existsSync(path.join(process.cwd(), "node_modules/central-icons/package.json"));

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    resolveAlias: hasCentralIcons ? {} : { "central-icons": "./components/icons/central-fallback.tsx" },
  },
};

export default nextConfig;
