import process from 'node:process';

// Optional deploy prefix for staging the export under a subfolder (e.g.
// nk00.com/private/rig-ir0). Unset → byte-identical to the normal root
// build; trailingSlash only flips alongside it so plain Apache resolves
// routes as folders without server config.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // D-016: static export through M1 — plain files, hostable on DreamHost
  // shared hosting with zero third-party runtime. Flips to a Node server
  // at M2 when the share service needs one.
  output: 'export',
  ...(basePath ? { basePath, trailingSlash: true } : {}),
  transpilePackages: [
    '@createosaur/genome',
    '@createosaur/illustrated-rig',
    '@createosaur/renderer',
    '@createosaur/species-data',
  ],
  images: { unoptimized: true },
};

export default nextConfig;
