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
export const TREX_R0_PACK_PATH = 'rigs/trex-r0-v2';

/** Pack-relative path → SHA-256 (hex) of every shipped file. */
export const TREX_R0_ASSET_SHA256: ReadonlyArray<readonly [path: string, sha256: string]> = [
  ["README.md", "a050d95df87afe223a461fc6a35ec65b91b703ea93372a0598051b1930c7fe77"],
  ["debug/approved-master-original.png", "4f4f34f78cdbc84f1c92063794a4fdf6f2503a0ffdcc95d0ccf7cdc5ebf70dfa"],
  ["debug/hidden-overlap-map.png", "890a150dbeed25c1d78c153470326b04e38bb4eeb1a6eff99b27b87538e3a139"],
  ["debug/layer-contact-sheet.jpg", "29341ffd91ce3b49f7f93f46aa80b18e55642465a9dadfd19fb909f1870179d4"],
  ["debug/pattern-mask-contact-sheet.jpg", "1c4aea82af1ae9b6e18e71f0ed9f15b4f72c8950c46061b86b7f249d9d2d2f58"],
  ["debug/reassembled-transparent.png", "ade610f6cee411799f4d75bd2237e7ecea87b1e4607ff0fff7237da157eb3fd6"],
  ["debug/visible-layer-ownership.png", "97fbfae49e366ee6057fbf985752b8cd7acf40a7a7213c207409a36700c37f0c"],
  ["layer-index.csv", "bf0c59346273bfd827ece2005655e5f4f3fe4a06e797d1b0c53853c35c72c903"],
  ["layers/00-far-hind-shank-foot.png", "faf59edfb2fb310c6706ee386719ed93c8b2dbcb3ecaba365d09ca44bc88cd78"],
  ["layers/01-far-hind-thigh.png", "840de07219a8b4777928dc2221cce51fa0e8863b50192e37c932c4681440a838"],
  ["layers/02-near-hind-shank-foot.png", "ccaebc13a73d6cc3122dc3b2ed711abce62e0630a8ee898f39fbccf4d946651a"],
  ["layers/03-near-hind-thigh.png", "fbffa9baae20890c576c0f69a14f8138d2e78480a558b7c3eefe38af2d83766d"],
  ["layers/04-far-forearm.png", "366ac9f197fb3cee4bade1ffc73e848c9f111d885fd4181bdfb7b1e83ad5b98b"],
  ["layers/05-near-forearm.png", "3eb1336265d576f42f36e80d3704da56950c13ccb1ee131ddca05872cdff89ba"],
  ["layers/06-tail.png", "96aea8466bd7a52cb502ba72a9f36a3e46bfd56cafa93e4e21758f2847f3e478"],
  ["layers/07-pelvis.png", "6eaea4f5103eaa077a9d876543ec406e9b70163f9eda9bdc497abf537ead6712"],
  ["layers/08-torso.png", "0e60674b4a02e025f2991cf16a85af12ac0f59730dfbd23c11a7c114f7ede55b"],
  ["layers/09-neck.png", "89d7a86d4a5dcfad1f4db22da182dde3ab26fbbc504c775e72bf3e1a355e374c"],
  ["layers/10-jaw-lower.png", "527b39d3595d55f95768fb11f01b948aecb6b43db738075876fcff7769e90456"],
  ["layers/11-head-upper.png", "731dbe917f4bd9426bd8d537e4d0a199f908286bf19c805978526a56453fc9be"],
  ["manifest.json", "17ea6244f75f6843185a8baeed7b0cb70e3a593d9c3cf51879b5bff8f518c47c"],
  ["pattern-masks/far-forearm/bands.png", "b09a6a91b5fb07f96ad969a2f7b0dfe28b189d7aff8fb38f910464f95be733c7"],
  ["pattern-masks/far-forearm/mottle.png", "02bfdaddce04e3a19ccabff4530b149221e3d8421ffecdd20fb4cac5bb4f207d"],
  ["pattern-masks/far-forearm/solid.png", "75387bdad90004077654e99d2cd80a875b78d6cfb44fa8cdf0d873473a78502c"],
  ["pattern-masks/far-hind-shank-foot/bands.png", "003a75244d0006eb375f0a9de50a6d1868a12a7ca291a05f5fbecf45cb614c0b"],
  ["pattern-masks/far-hind-shank-foot/mottle.png", "9ecce831104c67f52fb4c31eff1e763398743958f88489056bb79f68c186518e"],
  ["pattern-masks/far-hind-shank-foot/solid.png", "f72239b7e5dc0171465de0b48a8d7cce1cd880f027c50d213919897be8064f13"],
  ["pattern-masks/far-hind-thigh/bands.png", "08ca431c4e82e1c7f24308a7759b757998439353b4f88c7293c06e05290f0236"],
  ["pattern-masks/far-hind-thigh/mottle.png", "71ce9ddba5391570e1754798ef427d87b2d8bd4acf765b0431099074eddb7407"],
  ["pattern-masks/far-hind-thigh/solid.png", "0770ec9a38728b268cb76b2be796da84c344700c4a4fb56eb77e65de757ad2eb"],
  ["pattern-masks/head-upper/bands.png", "bf1dfd6842a9b9ca7e7ef05bfe66bad47baf3676183eb8d53a4c45fa47eca7f0"],
  ["pattern-masks/head-upper/mottle.png", "2850a07bf948e9fad2e565221f7031de7f0c212f3fcf39809409b9dc1b551f19"],
  ["pattern-masks/head-upper/solid.png", "d1e2173195290ff822f7675bb55f136cdcb28ed6c00495e883d8c89cd4f315aa"],
  ["pattern-masks/jaw-lower/bands.png", "172bc584c56dc7a18e84ed82f3669663de8bdc323f8a8ccb7884dfe804ae441d"],
  ["pattern-masks/jaw-lower/mottle.png", "7398918a97b9696818cdaadbd24b143ff9dcebae970681f58108ce1d0812c2b4"],
  ["pattern-masks/jaw-lower/solid.png", "e190f229f512eb90d023e49caf10400dd61ff663db7015dfa61d313fe2caefcc"],
  ["pattern-masks/near-forearm/bands.png", "06c8069bd918023b3314f48b160d8eb4c41c0c7eee2546aeb864552282e2ea56"],
  ["pattern-masks/near-forearm/mottle.png", "a68f54ede5bdfc95f797cba040b5410ed3f6d3bfda1c80957ae54b615d4c7d05"],
  ["pattern-masks/near-forearm/solid.png", "abe99c528e781e3d2c96f00609d2365b5e6e2e76631ceaea63b065b5001bae20"],
  ["pattern-masks/near-hind-shank-foot/bands.png", "f44df320fa6f4380bd7a7197b3c94795d6be23f615aab4ede707edda1e7a46ca"],
  ["pattern-masks/near-hind-shank-foot/mottle.png", "4c43579f038f07a0cfe3e8e0361a6f2146aad1f7c829318523fdc1f01de73831"],
  ["pattern-masks/near-hind-shank-foot/solid.png", "08e6b91f7b83fb0768a3b5c69910fb41e04161c30a947582311befd6730e8184"],
  ["pattern-masks/near-hind-thigh/bands.png", "5b9e6c6969ca5803d183be52acb943ce94dac4a7e64111bd215562a2913c4582"],
  ["pattern-masks/near-hind-thigh/mottle.png", "f4302202d009c1eed11b63fb81c00741acb01c9f6f76ddfffa91eeffd9a1af5f"],
  ["pattern-masks/near-hind-thigh/solid.png", "136a175ba974895e5319f5692a44c972a5f7fdb5682ddc62f6c4e6dc1d733299"],
  ["pattern-masks/neck/bands.png", "7ea09673ed83daea4c6ad261585ce1cd3e8b509dd8002ed31de12b505ca2db98"],
  ["pattern-masks/neck/mottle.png", "56614227de4e8d820559a199e1525f2204880e396e9d3493661dc94f4c067b2c"],
  ["pattern-masks/neck/solid.png", "4ceb29a18ed521ee2f64ffcbed40ed45a986cfe422a3017034fb40e74c7c7cb9"],
  ["pattern-masks/pelvis/bands.png", "f056e23b7fc127459f59e87d31d8bb57dae606d61a1dcfd4411b1e20da543d17"],
  ["pattern-masks/pelvis/mottle.png", "963af99b10e6079c610e776a84513755ee73c3c44aeb27d977689a816003b508"],
  ["pattern-masks/pelvis/solid.png", "a2ce053772c438ce5e8fc64f3d2ba299039406fdca1dfb27c63b3935873f7de4"],
  ["pattern-masks/tail/bands.png", "68f23549401961af79554e842839c007dca49533f4fe4b935a486215b1519c02"],
  ["pattern-masks/tail/mottle.png", "bd58fc51ab9c3a2a32be7b1ffd161860684c4a16efe69fda9f4a5c2e09c01def"],
  ["pattern-masks/tail/solid.png", "53ea272687ca5b1e2225fd4437b278278fc6a2951bff12dad84670ecd4523f8a"],
  ["pattern-masks/torso/bands.png", "4a7533bbc1807516e12654fef88cb5853c41651e2272c2436fefc51ddfc9abdf"],
  ["pattern-masks/torso/mottle.png", "b5fe8ab0029f954d61cb1b5ac3d6435a2dd14a7a35ae7dd1f9647d74989c9b06"],
  ["pattern-masks/torso/solid.png", "188d881d45546b7fe825cb20e70fe8439ce8a87af5f82636d86cc16364ae940c"],
  ["trex-master-clean.png", "ade610f6cee411799f4d75bd2237e7ecea87b1e4607ff0fff7237da157eb3fd6"],
  ["trex-master-neutral-preview.jpg", "978458061060b266e863e584a0c9229cb7bbc5ea0d084dea90168e0cd00ffd82"],
];

/** Pack-relative paths of the files the runtime rig actually loads. */
export function runtimeAssetPaths(): string[] {
  return TREX_R0_ASSET_SHA256.map(([p]) => p).filter(
    (p) => p === 'manifest.json' || p.startsWith('layers/') || p.startsWith('pattern-masks/')
  );
}

/** Public base path of the Allosaurus pack inside the web app. */
export const ALLOSAURUS_R0_PACK_PATH = 'rigs/allosaurus-r0-v2';

/**
 * Pack-relative path → SHA-256 (hex) of every shipped allosaurus-r0-v1 file.
 * Cut in-repo by tools/rig-pack from the owner-approved master (2026-07-21);
 * zero-error reassembly verified at generation time.
 */
export const ALLOSAURUS_R0_ASSET_SHA256: ReadonlyArray<readonly [path: string, sha256: string]> = [
  ["README.md", "d11927a9052eb9641e7a0939733a89d90ad73b7ef58a206c7ae3f6e163ce7d9d"],
  ["allosaurus-master-clean.png", "020e1dbb14278650480d37f9fffe750df986512e3d809e756c8d6d77504d9f16"],
  ["allosaurus-master-neutral-preview.jpg", "b3f5aa0b599a32b69a1e396373d99098cf5aad3b8bc38799c280d8fd4d19939c"],
  ["debug/approved-master-original.png", "0521166ba579b6eeda565f6e26a4edd78e9548eabad0df51560d891e43d2e26a"],
  ["debug/hidden-overlap-map.png", "beb813698eb91487765a367dc9d0a8ae18dc0bf106acd33f671c53dd51883ef2"],
  ["debug/layer-contact-sheet.jpg", "a2ffbd20d4bfd85c3299b4e0df3b350bd3f7e09d626ffbff6c8e8e190deab163"],
  ["debug/pattern-mask-contact-sheet.jpg", "bc295aa099d69d5ac0b40ce8c300799ee99e81136c51f07be14ccc631eb84678"],
  ["debug/reassembled-transparent.png", "020e1dbb14278650480d37f9fffe750df986512e3d809e756c8d6d77504d9f16"],
  ["debug/visible-layer-ownership.png", "7a339d87d049c81d8855b29aecb8a577ba9a475b79d336316348b9b6e6c9a807"],
  ["layer-index.csv", "55950a6171eed10a8743b74303469150cc68ca7386b20ac315c94ed12c29fa37"],
  ["layers/00-far-hind-shank-foot.png", "2b1e1395129e80cf68d4b9944b2ba6e48c8b13b088679a0fbd14324ad0858dfc"],
  ["layers/01-far-hind-thigh.png", "50ae7c8bdf61729b768e6c6195d28af5fbe4ef7da2c2ca6cef58746a264492d8"],
  ["layers/02-near-hind-shank-foot.png", "3e85295c99c776517135276efb37ae58fb9a703fc85419b080cff1cfe9097a8c"],
  ["layers/03-near-hind-thigh.png", "76571814a0e3a5efe43eaa8da5ad27c5326f4c373cb0dbcf2c66136cba631621"],
  ["layers/04-far-forearm.png", "4bb27b9f13b9df6ecdc15ae0025a666d5758670a62cd52bff14f9f07d4079c8d"],
  ["layers/05-near-forearm.png", "f19fcb004734d62cb1642a8650291cc2f1d24fb02c4bce9eaae2459b8a1807b1"],
  ["layers/06-tail.png", "868a592db0f7f1568786145c218d78cb4fea6c9495f5cbc8fe75a860082674cd"],
  ["layers/07-pelvis.png", "5b27e7e96c080233ab1fca1bda934f93ffdaa0e5ae22b94b1e56845b38a4f4f3"],
  ["layers/08-torso.png", "021469610df0c24f812ee9ab91cb336e11e698a6eefa36248b17d807ec575064"],
  ["layers/09-neck.png", "90606e9b534bb11e869861cb3324022c467939882afb07fe13ce08d413bd46ad"],
  ["layers/10-jaw-lower.png", "40dcb823cd03f2dd3494559a18d4b18c1b4e777ee2bc17de5950d01cf6949cfe"],
  ["layers/11-head-upper.png", "09457d911599a347e98f2ba942786c92ccf1c4e930b65a1ca99f60e3b2c1cbbd"],
  ["manifest.json", "9f45bb2f8933aec57aee33b4a8ba19fc81de98c792b32238944c901498d75bbf"],
  ["pattern-masks/far-forearm/bands.png", "17688f3fb959bda80a405a3831663ee62ddd15f983422db4c3554e1eb6dcbbf2"],
  ["pattern-masks/far-forearm/mottle.png", "1fd1a1b7d35bf18d058416aca8f447348a7632cea0e8c93cc1982ac2f96611ea"],
  ["pattern-masks/far-forearm/solid.png", "df835fb893befecd042f77634507b745077d9a824496a6843f976854c525d3fd"],
  ["pattern-masks/far-hind-shank-foot/bands.png", "c748c057cf8c468dbef5cf689cc5624805fa12d3c5691e8736fec542f48bed76"],
  ["pattern-masks/far-hind-shank-foot/mottle.png", "25da72c329b013380917fe26b78871a427ff23752dd185075fe69b1451891517"],
  ["pattern-masks/far-hind-shank-foot/solid.png", "53de2fe74f8c7a480ee95318f08f07723c7f9091f22878eb46d2530c7fdb99be"],
  ["pattern-masks/far-hind-thigh/bands.png", "31a6e0581a936ab7ccbde9cb90672a58fcb38712bc795538a448a11990e12ce9"],
  ["pattern-masks/far-hind-thigh/mottle.png", "bf3ef355f4bbd85a1c91b157de476114905a646dfa0ddcfb4d05f08d3ef4cbdc"],
  ["pattern-masks/far-hind-thigh/solid.png", "b26ffcc2c4b8b1f8f032318dc0226920515fd393085258ff218d915d7a971537"],
  ["pattern-masks/head-upper/bands.png", "b7af66ceef74f1b4f66f41a6d157a784e955f539a3af0bac6d76ef4d7c3de0ff"],
  ["pattern-masks/head-upper/mottle.png", "fe3c970fee8f766c045b73177495b9938b02715df48b943c6291f32c96185662"],
  ["pattern-masks/head-upper/solid.png", "07eacbd0718e443b298d676e16694075b414305075b1c4787e146977bd61ab37"],
  ["pattern-masks/jaw-lower/bands.png", "007e44b23feaec28b69d9a3f49de5c80d604442c426ccbad422132f363510f08"],
  ["pattern-masks/jaw-lower/mottle.png", "ed655900c6a5b534f9a688d2f611531e547afb1f64a0495fd1520d1114e3434f"],
  ["pattern-masks/jaw-lower/solid.png", "ac0a56b94a8d3f1e55226d9bd931ac6f3e13019fff8c3d417033375a18108693"],
  ["pattern-masks/near-forearm/bands.png", "2dd21b1c3ff751f1a091a906432412845ad31f39fdae8e2a4a7140d17494d029"],
  ["pattern-masks/near-forearm/mottle.png", "13f94a7a123e0eaa8aba3224b91f047e9b05beed6f6201e8a3e2bcb170a044f8"],
  ["pattern-masks/near-forearm/solid.png", "b133df0a89dd0973ff3b1a2c02c04227811e001fb2a9b8714ad75b13cd466a29"],
  ["pattern-masks/near-hind-shank-foot/bands.png", "a0f7c97ba7dc968b7d6fe72ce7143dfbf59e20581280244f9c51c6d8afe91a95"],
  ["pattern-masks/near-hind-shank-foot/mottle.png", "bb5c8d3e7ff90c2581cd2be0d385137fcaab727c80dd21311eefd585be674d1f"],
  ["pattern-masks/near-hind-shank-foot/solid.png", "d78b4c041f0a8a56a60a336ef6eafde6e02c2ab1268dc27a750a6eda093d8f95"],
  ["pattern-masks/near-hind-thigh/bands.png", "011326d4944e1f56ccc2d9b53a1fbf13ae014286f80abdd3aeb882d22bcb9efe"],
  ["pattern-masks/near-hind-thigh/mottle.png", "d385f1ac79f38891ee37e5573943eebbde3093bc97aa59767e0f4fcbc1917ac3"],
  ["pattern-masks/near-hind-thigh/solid.png", "eca4fbf3a864ba2c829c2aaae502e12a751eebc59afac5a5c21165060ebf9224"],
  ["pattern-masks/neck/bands.png", "9386aede8b1d2b1ad15d4143e4db6f2c5c9b4b59b13e53bf7933bdbaee92378c"],
  ["pattern-masks/neck/mottle.png", "c728530c4b4728eabd88ccce90230cd296a0a5454abf95da70ad9e53de86ce32"],
  ["pattern-masks/neck/solid.png", "a4e48115516e5b2709844c7a0e70cc8347339ef4279a5516d5ec1a9e87f82e64"],
  ["pattern-masks/pelvis/bands.png", "c9a142d89513f51b0a853b089f25a59e96445b6aca67f8b705387947791f95d7"],
  ["pattern-masks/pelvis/mottle.png", "7abf0cb81b06507e7a50e020101e95a7d3c9f7e6cee3eddfa4c5a3ca79ad4c37"],
  ["pattern-masks/pelvis/solid.png", "f4e838e1286fd8250689d5d12c690ac55657c16275f206ea5ec44877176e6176"],
  ["pattern-masks/tail/bands.png", "b7977d65e0af7f8a37baa51ffb3ad66b8b215be16e7c10df50dd1195dd4e0631"],
  ["pattern-masks/tail/mottle.png", "efbf8411a24585e99ac47c7e5363cb754972cfe9111b39a523fb0730cc9697d6"],
  ["pattern-masks/tail/solid.png", "647ffafcea66b834f3d91425a58c98d9fb814e3a8bca44fa39d4637de53a1816"],
  ["pattern-masks/torso/bands.png", "b80312ae91f5f4a6391cd4b84a9497c27cae8faf6b8b34bf3667d962becca355"],
  ["pattern-masks/torso/mottle.png", "758ac8a99229ca575eadc8b0c6e1125bbb5b5a940a5a5f8faa5634523807f8db"],
  ["pattern-masks/torso/solid.png", "26fc0c2de74a9d4aebff25db3f71ce64e677c78358d84714694c9328e7ac9033"],
];
