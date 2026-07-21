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

/** Public base path of the Allosaurus pack inside the web app. */
export const ALLOSAURUS_R0_PACK_PATH = 'rigs/allosaurus-r0-v1';

/**
 * Pack-relative path → SHA-256 (hex) of every shipped allosaurus-r0-v1 file.
 * Cut in-repo by tools/rig-pack from the owner-approved master (2026-07-21);
 * zero-error reassembly verified at generation time.
 */
export const ALLOSAURUS_R0_ASSET_SHA256: ReadonlyArray<readonly [path: string, sha256: string]> = [
  ["README.md", "a0c443491a324c30fefcefd53d397981fbf9c9a7cc3c7a4c75006068433ebc6f"],
  ["allosaurus-master-clean.png", "f7d1ce42f5659d7fa3e5ba14b90c6e4b6d025b7f69f7baae77d90d3ac30afd2d"],
  ["allosaurus-master-neutral-preview.jpg", "09a6c2fea378566b1859240f79589064218f890f4602ba2776696d578a33bf66"],
  ["debug/approved-master-original.png", "2ef2f649e29bbaadefc034871743b4bf1d3d22f898f50e37e5986bc1ecbd9fdf"],
  ["debug/hidden-overlap-map.png", "2a1c75ac6eaeb384220b44aacd1e14dc28776e12130f1be4b728cb5c01a2cd37"],
  ["debug/layer-contact-sheet.jpg", "a5a52024ec413d38e2859ab50380492364198770684f44e2f97695e8dbd82457"],
  ["debug/pattern-mask-contact-sheet.jpg", "f31354728a29e5d62531ff5a890f4fae96c9e4ce26bfcb79147c1544be73e496"],
  ["debug/reassembled-transparent.png", "f7d1ce42f5659d7fa3e5ba14b90c6e4b6d025b7f69f7baae77d90d3ac30afd2d"],
  ["debug/visible-layer-ownership.png", "1d13d13ec8f63c59ce7c8619888823e2ba3d71cc1258c342c408e8510fc9c610"],
  ["layer-index.csv", "d1a813644494291f4805c58bd79780c20ae3c8600549a9ab4bcb8b3cac1f07c5"],
  ["layers/00-far-hind-shank-foot.png", "45d2ec18261bb8e8ffa32cdfd5ec68dadff0f5526e003e409ea3d80fc6ced05e"],
  ["layers/01-far-hind-thigh.png", "b891c2c76538e2e832286ba5eb936a1376952658e1b13a8c902bf798cf5fd0a4"],
  ["layers/02-near-hind-shank-foot.png", "c9e6332771e6e3fcf2720a0388dd82fab676d33221ae3dced68a512f585eea2d"],
  ["layers/03-near-hind-thigh.png", "2b99a8848ee5eeedcf6d866d9c1f9e64cd9949594930eb755840c931ed8da896"],
  ["layers/04-far-forearm.png", "db66682c368aa3157d33fe26c4575a0c0d39b9f06adaccc71670e8e35646a6d1"],
  ["layers/05-near-forearm.png", "b1a57ef7b154f09565d5e4dafec67f54408cc90050265f8ff30bb5e32a8caf1a"],
  ["layers/06-tail.png", "3b51f662ac3d0ef4b65bd8a69e16140b276b07160da30e62e24f8d56e43a473c"],
  ["layers/07-pelvis.png", "b7becbc783e8edae7e78fb8dcdd3ef4c6cf522fef9db7fe2e4bf6fa1bc443956"],
  ["layers/08-torso.png", "b708f513169a81326eec8298e71697b92c3f5ec0477dc6dd25ae5ac248f1cd32"],
  ["layers/09-neck.png", "e0b2105a73c05e3893398eecb66ade393e479940458ea24ff8c97900ba29f828"],
  ["layers/10-head-upper.png", "8740543cc2eb2ffc3a54e5da7d8b37d529b0ea90bb9c06af9d53f7737282bb34"],
  ["layers/11-jaw-lower.png", "93e538132f22916c50575f6232f8071e48e870d0615514465c1c975e4a25aa29"],
  ["manifest.json", "9c539483e8b8da8aa51b953034388e10387d3c61969c8e5bfedecc6bc7cea8c2"],
  ["pattern-masks/far-forearm/bands.png", "aee188922b8161710b998c7f53474bc3c7631da3a63a94a23746198164da10e7"],
  ["pattern-masks/far-forearm/mottle.png", "26d6c5f1b09ea49112dc59d08f0f4eeb682a442c611f154c560f1d17e8e96126"],
  ["pattern-masks/far-forearm/solid.png", "9d07195a74bb97e456ec10b4100879e81fe1c6cddf05105ccc79d95f2f1bf3d2"],
  ["pattern-masks/far-hind-shank-foot/bands.png", "b6d2752fc09d7c746d573450cca9d726893fc5b13b919771ab68c066a7713a3a"],
  ["pattern-masks/far-hind-shank-foot/mottle.png", "b17d8e5485ff5993a6674dee2ff1a928edf8f71a3b14bacb9737be8b5f66f765"],
  ["pattern-masks/far-hind-shank-foot/solid.png", "6beb34f7e01c4bcd53872b7ff174044cfc88ea8adb608a29777735e046e7a557"],
  ["pattern-masks/far-hind-thigh/bands.png", "3ed6a391cb70750d0752c13d41e725208c8140ab20aec19c8fd6d4f689e37ff5"],
  ["pattern-masks/far-hind-thigh/mottle.png", "b97722d7a42de2c3d90cdfaecc8e9dc89aeee9be51764a6538d0e633265837c2"],
  ["pattern-masks/far-hind-thigh/solid.png", "3dade8bd313a4d113542cee1a84dcdf667337ccc3bc9843327d3f529341b9013"],
  ["pattern-masks/head-upper/bands.png", "b4945bcf3cd5b35af5022a16b2ce0c833836649f7b0f61926521f5603fd92491"],
  ["pattern-masks/head-upper/mottle.png", "67a33022ec9ab2a3d0ce95f39df62b9d793c8ac7d883df50a63e93233bff3027"],
  ["pattern-masks/head-upper/solid.png", "ceb4dc141ebb3aaaa66df26e8e108bb7849d57028a6357dd14a055dd060d910e"],
  ["pattern-masks/jaw-lower/bands.png", "cc40e6cc98e23b09438d5af0cc179fbf61c40855ba98fd79b7694d843c501719"],
  ["pattern-masks/jaw-lower/mottle.png", "da90920a2d196f166aa9960d9c14a25ad2ddaba7c485a852729de862ba219dba"],
  ["pattern-masks/jaw-lower/solid.png", "31e1651007500b3ea4a917eaca8412bd49ffe0abf2b65fc359c310cd56a18d4a"],
  ["pattern-masks/near-forearm/bands.png", "42e168f97927e9aefcdff2db77567c0fb5bc05f0c98d3383d095a2acb14e19c8"],
  ["pattern-masks/near-forearm/mottle.png", "b958de3dba6b194cd4b2fd94a25203b55605dce6627223c787a3a0f4822196b4"],
  ["pattern-masks/near-forearm/solid.png", "b333aa2bc30137e048f83293d1bb5c1e9c7496650c7eb1178a7c8367dff985ca"],
  ["pattern-masks/near-hind-shank-foot/bands.png", "31714d6edcc529f219a56df29eeb0713cfed51a84d7eaaee91235e7cfead7424"],
  ["pattern-masks/near-hind-shank-foot/mottle.png", "170d17a3358c8009cf16eef0583d8b744e92efbe552361ed2899f5e6684e0e73"],
  ["pattern-masks/near-hind-shank-foot/solid.png", "68ca907ba00aa96fc635a90d9a32ece93b5a00294ec862cc1746a82af672e910"],
  ["pattern-masks/near-hind-thigh/bands.png", "067ef61d15c87e8fe1f283b8583e22c28689f1e41d3650c4a0a6e3721c3ca9dd"],
  ["pattern-masks/near-hind-thigh/mottle.png", "f867129160847868ecc1b2261a711634ca11847c5231facaf2219dcc1b2342b4"],
  ["pattern-masks/near-hind-thigh/solid.png", "d7c247f71661b3cc07025a323ec08ef227fa38fe801d214823f25be068fba6a4"],
  ["pattern-masks/neck/bands.png", "b05741557bda56438f0ec516594e55f90dd23468521b9ecf266016b1e8e867f0"],
  ["pattern-masks/neck/mottle.png", "a3ad1e7fe2cf643cf35624d4d97c42b19aaa29fc86fdb9e85a130d864f134eca"],
  ["pattern-masks/neck/solid.png", "98c673158feed4541d4955ad7973e527fa202c02d3a7041d29932eb268037340"],
  ["pattern-masks/pelvis/bands.png", "5bfa5eb344628a1a594784782a2242fccab0988452264ba46446c24222b7c556"],
  ["pattern-masks/pelvis/mottle.png", "445253c7f9bf06641f01b1fc9180be11658973de0f6e7fd1df40c12be10a8344"],
  ["pattern-masks/pelvis/solid.png", "5ddb55e33a8c301e84b3644a7a093852b0c5b716cfd99d0ff57a3996f7364e4b"],
  ["pattern-masks/tail/bands.png", "50353976463e34aa5067af0d6799ca2e0e3dceb1281c8a2bae6a419b1bb236f8"],
  ["pattern-masks/tail/mottle.png", "1c9f957c6539f3f397d0add2b90de7a58f72c8d8f796f7578f97b111fe50eff9"],
  ["pattern-masks/tail/solid.png", "7214cc3ef751fcab85b963baa800be0a4a68ac65d9a1d1aadbdb2654017b3bdb"],
  ["pattern-masks/torso/bands.png", "9316bf88326879d6685d784b1ce28e0e43fe42c86de6466a18ecae9cb9f3c912"],
  ["pattern-masks/torso/mottle.png", "b6652fe4575632390f9b47f4147a28b68d27896262d10c77d51c877e588b218e"],
  ["pattern-masks/torso/solid.png", "bf8628d33a7ef9dee9d8f82515506c7ad1eebe59f71cdb78c59162274f95eab4"],
];
