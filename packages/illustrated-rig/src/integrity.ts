/**
 * Asset-integrity contract for the trex-r0-v1 pack.
 *
 * Every visible pixel in the pack reassembles exactly to the approved T. rex
 * master; nothing may be repainted, regenerated or substituted (owner
 * decision, D-020 handoff). These SHA-256 digests were recorded from the
 * approved handoff package (ASSET-CHECKSUMS.sha256); a repo test hashes the
 * files under `apps/web/public/rigs/trex-r0-v1/` against this table so any
 * silent asset drift fails CI with the exact path that changed.
 */

/** Public base path of the pack inside the web app. */
export const TREX_R0_PACK_PATH = 'rigs/trex-r0-v1';

/** Pack-relative path → SHA-256 (hex) of every shipped file. */
export const TREX_R0_ASSET_SHA256: ReadonlyArray<readonly [path: string, sha256: string]> = [
  ["debug/hidden-overlap-map.png", "67afa24374b812bca8ba706f8b3534d50091ecbda237e36c28e126da6e51df2c"],
  ["debug/layer-contact-sheet.jpg", "df906bcbc932c695069400e0a2780a8bd411909a26924b72e3f9cc1b06cef991"],
  ["debug/pattern-mask-contact-sheet.jpg", "c79dbe548dc12d6620ed4951f3421e6dd18a82d98897d1402153ef64d9142f14"],
  ["debug/reassembled-transparent.png", "5e8c46bb941a5295dae5a14050e70ffb29f53c24200b855de9d07f66739a891a"],
  ["debug/visible-layer-ownership.png", "0da6e80479ff8b863f014dd15ab265fdd973502469d97bb0eaa468c6200ce29b"],
  ["layer-index.csv", "e8603d6c795420d772b5452c24838553fd4b7e609903a91662150b1f10645418"],
  ["layers/00-far-hind-shank-foot.png", "db096940cb9f1e40c49ae57c8bdb27e1f53740625b5d85cbf3095d46d2afa652"],
  ["layers/01-far-hind-thigh.png", "236f67091fa6da57a58dd78ed8e0240741d4ed663622bfee7677b1487f7eadfd"],
  ["layers/02-near-hind-shank-foot.png", "5e43656fa5421097e10379cd994cd88aa0161c4db62dc7de77e9ecad5eeb54dd"],
  ["layers/03-near-hind-thigh.png", "bdc01b072b8272b5df586949bd4f903735d614ed73b5fbeeb67b7004957905a8"],
  ["layers/04-far-forearm.png", "5b5274a0b1a8eeae8a0e810a7dad973da1a1718d4f3dbf0d5f2a4b98fabfb12f"],
  ["layers/05-near-forearm.png", "f3cfb071921e8a002d85bf63d2e16f2789728eb5784ce9ecd6d3a440fa74fcc8"],
  ["layers/06-tail.png", "2cf7966ed212b5e0dce4ac92abb2c5f17959e176fe5375d8088a2e70facc03aa"],
  ["layers/07-pelvis.png", "f99beb2f1e658e2e11292a99abf680b10fdf73f0920d6aa075b82a27ff9f7b3c"],
  ["layers/08-torso.png", "e4b503c9f184137d7d920b81ac3114a2d76c7608728b43d95e80aa31d4920711"],
  ["layers/09-neck.png", "990e976faa4118be49526940b7093ea069758e686804ba93082d5c7d6110e523"],
  ["layers/10-head-upper.png", "cab4383b77cc716efbddef6697ea7d63a3a644c0baa695fd749b2640fa81cc48"],
  ["layers/11-jaw-lower.png", "592dbe039e0658f66e0cbe86f4cd12b144e523a829f88f929e322027223f97c6"],
  ["manifest.json", "78e3abb23e6407e09c2632d2d690c562f628e50d3bae08257eb6eaf96070e4e2"],
  ["pattern-masks/far-forearm/bands.png", "65f69a8e94096bfe040a77adaa5d7d88aeab53835f703d820ac17c5e3f3f7bda"],
  ["pattern-masks/far-forearm/mottle.png", "f83f50738e61bf0733f6ff3215ee8874ff2909ba4d50bd4a32fbcbea5610a434"],
  ["pattern-masks/far-forearm/solid.png", "7a770a4f6da507a2b48628454dec356f51ff495abd098e6579a89ba1f405ee6c"],
  ["pattern-masks/far-hind-shank-foot/bands.png", "1532a42750d373ee6d8a229a04f67963d024215ea2674ffd5db0c6d324b4a3e3"],
  ["pattern-masks/far-hind-shank-foot/mottle.png", "0b2e9246c59ab87d7cba7001c739ee9f9c105786ba21167cfd5d5fe115139af3"],
  ["pattern-masks/far-hind-shank-foot/solid.png", "5770af425c1797fb4cc78590a5eef9a934e93e9a954a07d17856909abbc7877b"],
  ["pattern-masks/far-hind-thigh/bands.png", "4f081b988ec66ca0bed45a219f628943ced0efca6659cf9de077c438a6b13e0a"],
  ["pattern-masks/far-hind-thigh/mottle.png", "cc1e7cd438b8fcd8bdbfbf6048bf8c9f58fab738145f8bead32a79c1a49725e8"],
  ["pattern-masks/far-hind-thigh/solid.png", "351ddc6c85d099388b947c5f03577ae29233ae24853ba09aa23c59ec7e6a117d"],
  ["pattern-masks/head-upper/bands.png", "3f3cda693828360d62bbc41ceabd06f5b2de4ad0f7c90bf777280955aa47b5b2"],
  ["pattern-masks/head-upper/mottle.png", "b9c2a8eb6a8fc0cd707b53e67d920b968a667ee5c15f4119ff07e9f204264eb3"],
  ["pattern-masks/head-upper/solid.png", "eff131944cecbeac8b59dab8f86a7deeb46c80809911894abbac06b64508be4b"],
  ["pattern-masks/jaw-lower/bands.png", "3cc4aa1fdaad2133917e84315c06fac2aab8dadcc502e96873d56bca2135842a"],
  ["pattern-masks/jaw-lower/mottle.png", "d062ad6c1d750b004453645778be00a0777e05457b49c71cc973be6e52ce72c3"],
  ["pattern-masks/jaw-lower/solid.png", "b0c804c30ce67c8300bf578bc19c99e5e1bad0e10668b798ba864994090b2211"],
  ["pattern-masks/near-forearm/bands.png", "84ff2a7cfff9c73e884e79944b5f361346f7bdb46afffb8d29ffcead1dbb8d49"],
  ["pattern-masks/near-forearm/mottle.png", "d57babbb545ab66b52e1289dea185800d7f6c57f2b47a0cfc8ece05842fe556e"],
  ["pattern-masks/near-forearm/solid.png", "8023ba670269731841194c004cc39a667755797686069da89551d06b9b193acc"],
  ["pattern-masks/near-hind-shank-foot/bands.png", "026bd128bf79b01bca6a534af49ec73398e1fca6c7d74129a819abab3f9b65d1"],
  ["pattern-masks/near-hind-shank-foot/mottle.png", "eb74672936d7c3e369d675d68e69b378e81950c1018f68e7b673e0e921bb0332"],
  ["pattern-masks/near-hind-shank-foot/solid.png", "b6bd04d63c093dfad435ba8fe33f5d2f12836a99193a7e275e5898553a058699"],
  ["pattern-masks/near-hind-thigh/bands.png", "9b8de6ae866fcd0ef7cffcc9ec98a4029677b58028fbbd17fa6fe3380510f2cd"],
  ["pattern-masks/near-hind-thigh/mottle.png", "808343055e8408db60bd80096629a92ff415763bf53159bd955284a753b5c370"],
  ["pattern-masks/near-hind-thigh/solid.png", "907a42fa5323ec98840a8f76abd2bc26d317445bb1d82633b03543ed809ee1a4"],
  ["pattern-masks/neck/bands.png", "90525761c5c43898f18e35edce4e4ab103f7f3d962e8bb386603919f94e55196"],
  ["pattern-masks/neck/mottle.png", "0653fd673ed92f555af3de165fe44c7dcafabfe63735a4e794a6a2a318d7f12d"],
  ["pattern-masks/neck/solid.png", "2627ddec06385f67267f0118c5a9ee0f7dc4805622f5847e01bf482e3f8e0412"],
  ["pattern-masks/pelvis/bands.png", "eb59e5348edec6328f554e2223e72b62c94d755c2e603bab3ccad488ac686c36"],
  ["pattern-masks/pelvis/mottle.png", "21a7a9ecc1dfb1c5b78c7d0875c4bbf0cedbe27a321a5d3d02475967642a70d0"],
  ["pattern-masks/pelvis/solid.png", "e7dc40804d8f86ec6301a4682e553f2f3a7efe0deee6255ea9c891621e8eb2fc"],
  ["pattern-masks/tail/bands.png", "e6a483da7a3a4bd905344b9d1bc8a32fcf39d3c343fcc419e41176033700858e"],
  ["pattern-masks/tail/mottle.png", "39a17d22562040e9c5f0a3535d3fbdce55b5c59fafd58ad9d8c886febd933122"],
  ["pattern-masks/tail/solid.png", "ea84aba315acbd6a7fca4e8066cd79f8f05041f8a030cb4e38726c1eeb9acbd2"],
  ["pattern-masks/torso/bands.png", "a77700a2a653b8591e33b0b26c202922eccc44533b1e15ef13c36de12ed4aa7b"],
  ["pattern-masks/torso/mottle.png", "483482e2965363fb0866844057c782edf69b851f61a374f5a88ea853106aa8d6"],
  ["pattern-masks/torso/solid.png", "541086e1ea86b86290749a4390ccfdc47228f0c4da4859bfb9c8e2c406299117"],
  ["README.md", "329fc0fcbdd47dd3ecb0c95501b0d1753ca93fa7385ebf3c1f4c93cbb8c14cd7"],
  ["trex-master-clean.png", "5e8c46bb941a5295dae5a14050e70ffb29f53c24200b855de9d07f66739a891a"],
  ["trex-master-neutral-preview.jpg", "30f4a50b8b8f17d83a7e1d54ada954a2a0f127bd81041a223bdb45c2e2593d83"],
];

/** Pack-relative paths of the files the runtime rig actually loads. */
export function runtimeAssetPaths(): string[] {
  return TREX_R0_ASSET_SHA256.map(([p]) => p).filter(
    (p) => p === 'manifest.json' || p.startsWith('layers/') || p.startsWith('pattern-masks/')
  );
}
