# 25: i18n, preferences and alternate HUD layouts

**What to build:** The whole UI is available in French and English, and the player picks the language and the HUD layout in a preferences screen.

**Blocked by:** 14

**Status:** resolved

- [x] All UI strings come from FR and EN catalogs; core errors and events expose message keys, not text
- [x] "Urbtopia" and "Urbs" are identical in both languages
- [x] Preferences screen with language and HUD layout (C default, A bars + bottom sheet, B minimal + radial menu); choice persisted per viewer in the browser
- [x] Layouts A and B work over the same store and scene API as C, with no logic duplicated
- [x] One React component per file; tap targets at least 44 px
- [x] Missing translation keys are caught by a test
