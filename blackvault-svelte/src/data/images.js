// Single source of truth for every image in public/images — filenames only,
// encodeURIComponent is applied at the call site.
export const IMAGES = [
  '(1) Home _ X.jpeg', '(4) Instagram.jpeg', '0a2c0100.jpeg',
  '0xAC001p.jpeg', '0xAC002p.jpeg', '0xAC003p.jpeg', '0xAC004p.jpeg', '0xAC005p.jpeg',
  '0xAC006p.jpeg', '0xAC007p.jpeg', '0xAC008p.jpeg', '0xAC009p.jpeg',
  '0xBG001w.jpeg', '0xBG002w.jpeg', '0xBG003w.jpeg', '0xBG004w.jpeg', '0xBG005w.jpeg',
  '0xEP002p.jpeg', '0xEP016p.jpeg', '0xEP074p.jpeg',
  '1550c5e7.jpeg', '22e445ac.jpeg', '43b8eabb.jpeg', '7202bba0.jpeg',
  'Full metal alchemist.jpeg', 'LS (@LS182_520) on X.jpeg', 'S7E1.jpeg', 'S8E5.jpeg',
  '_ (11).jpeg', '_ (14).jpeg', '_ (21).jpeg', '_ (7).jpeg', '_ (70).jpeg', '_ (79).jpeg',
  '_ (8).jpeg', '_ (80).jpeg', '_ (9).jpeg',
  '_ - 2026-05-29T231447.811.jpeg', '_ - 2026-05-29T231555.908.jpeg',
  '_ - 2026-05-29T231656.649.jpeg', '_ - 2026-05-29T231703.415.jpeg',
  '_ - 2026-05-29T231708.893.jpeg', '_ - 2026-05-29T231755.962.jpeg',
  '_ - 2026-05-29T231922.068.jpeg', '_ - 2026-05-29T232009.086.jpeg',
  '_ - 2026-05-30T130745.408.jpeg', '_ - 2026-05-30T131505.407.jpeg',
  '_ - 2026-05-30T131710.853.jpeg', '_ - 2026-05-30T131759.220.jpeg',
  '_ - 2026-05-30T131906.423.jpeg', '_ - 2026-05-31T130615.354.jpeg',
  '_ - 2026-05-31T130836.546.jpeg', '_ - 2026-05-31T131218.140.jpeg',
  'by Lazlo.jpeg', 'jjhoa.jpeg', 'm a i k ⚡ comms (@maik_check) on X.jpeg',
  '彡 by budkalon – twt.jpeg',
];

export function imageUrl(name) {
  return '/images/' + encodeURIComponent(name);
}

// Deterministic, non-repeating (as long as count <= IMAGES.length) slice of the
// shared pool, starting at `offset` and wrapping around — lets each view claim
// its own stretch of the pool instead of everyone reusing the same handful.
export function imageSlice(offset, count) {
  const n = IMAGES.length;
  return Array.from({ length: count }, (_, i) => IMAGES[(offset + i) % n]);
}

// Non-repeating slices for the "card" surfaces (Study covers, Range labs, Case
// covers) — 39 cards total, each gets its own unique image out of 57.
export const STUDY_COVERS = imageSlice(0, 12);
export const RANGE_CHAPTER_COVERS = imageSlice(12, 12);
export const RANGE_SKILL_COVERS = imageSlice(24, 13);
export const CASE_COVERS = imageSlice(37, 2);

// Decorative scrolling strips (Map / Arsenal / Threads) — different rotations
// of the full pool so the three strips don't show the same run of images.
export const MAP_STRIP = imageSlice(0, 19);
export const ARSENAL_STRIP = imageSlice(19, 19);
export const THREADS_STRIP = imageSlice(38, 19);
