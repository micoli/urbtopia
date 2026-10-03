# 24: Export, import, backup and recovery

**What to build:** The player can back up, move and recover their city safely. See ADR 0003.

**Blocked by:** 22

**Status:** resolved

- [x] Export downloads `urbtopia-<seed>-<date>.json` using the same envelope
- [x] Import: file picker, parse, format check, migrate, validate, confirmation "replace current city?"; previous save goes to the backup slot first; follows the reopen path (`advance`, 48 h cap, clock clamp)
- [x] Backup key `urbtopia-save-backup` refreshed about every 10 min and before import or migration
- [x] On load failure, never delete silently: recovery screen offers restore backup, export raw data, new game (confirmed)
- [x] Single active tab: ownership token plus `storage` event; other tabs go read-only with a banner and a "resume here" button
- [x] Quota error raises an alert and offers export
- [x] Discreet export reminder if the last export is older than 14 days and the city progressed
- [x] Tests with a fake `SaveStore`: import validation, backup restore, newer-version refusal
