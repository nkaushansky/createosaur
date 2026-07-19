/** @type {import('next').NextConfig} */
const nextConfig = {
  // D-016: static export through M1 — plain files, hostable on DreamHost
  // shared hosting with zero third-party runtime. Flips to a Node server
  // at M2 when the share service needs one.
  output: 'export',
  transpilePackages: [
    '@createosaur/genome',
    '@createosaur/illustrated-rig',
    '@createosaur/renderer',
    '@createosaur/species-data',
  ],
  images: { unoptimized: true },
};

export default nextConfig;
