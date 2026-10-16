/**
 * Helper to resolve reliable, static public cover image URLs for books.
 * Handles migration from local Vite dev paths (/@fs/...), external stale URLs, and fallbacks.
 */

export const STATIC_COVERS_BY_TITLE: Record<string, string> = {
  'bumi manusia': '/covers/cover_bumi_manusia.jpg',
  'laut bercerita': '/covers/cover_laut_bercerita.jpg',
  'cantik itu luka': '/covers/cover_cantik_luka.jpg',
  'jujutsu kaisen': '/covers/cover_jujutsu_kaisen.jpg',
  'one piece': '/covers/cover_onepiece_100.jpg',
  'spy x family': '/covers/cover_spy_family.jpg',
  'sapiens': '/covers/cover_sapiens.jpg',
  'kosmos': '/covers/cover_kosmos.jpg',
  'clean code': '/covers/cover_clean_code.jpg',
  'english grammar in use': '/covers/cover_grammar_in_use.jpg',
  'grammar in use': '/covers/cover_grammar_in_use.jpg',
  'nihongo kira-kira': '/covers/cover_nihongo_kirakira.jpg',
  'bahasa jepang': '/covers/cover_nihongo_kirakira.jpg',
  'bahasa korea': '/covers/cover_bahasa_korea.jpg',
  'percakapan & kosakata bahasa korea': '/covers/cover_bahasa_korea.jpg',
  'toefl': '/covers/cover_toefl_official.jpg',
  'cpns': '/covers/cover_cpns_diktat.jpg',
  'skd cpns': '/covers/cover_cpns_diktat.jpg',
  'utbk': '/covers/cover_utbk_snbt.jpg',
  'snbt': '/covers/cover_utbk_snbt.jpg',
};

/**
 * Resolves a book cover URL to a permanent public static URL.
 * Prevents broken images when published or accessed from other devices.
 */
export function resolveCoverUrl(coverUrl?: string | null, title?: string): string {
  const normTitle = (title || '').toLowerCase().trim();

  // 1. If we have a matching static cover for this title
  for (const [key, path] of Object.entries(STATIC_COVERS_BY_TITLE)) {
    if (normTitle.includes(key)) {
      // If the provided url is an internal dev path (@fs), localhost, or outdated unsplash, return the public static path
      if (!coverUrl || coverUrl.includes('@fs') || coverUrl.includes('localhost') || coverUrl.includes('unsplash.com')) {
        return path;
      }
    }
  }

  // 2. If url is invalid or a local vite dev path
  if (!coverUrl || coverUrl.includes('@fs') || coverUrl.includes('localhost')) {
    // Try matching again or fallback to generic cover
    for (const [key, path] of Object.entries(STATIC_COVERS_BY_TITLE)) {
      if (normTitle.includes(key)) return path;
    }
    return '/covers/cover_bumi_manusia.jpg';
  }

  // 3. If it's already a clean static or valid http(s) URL, use it
  return coverUrl;
}
