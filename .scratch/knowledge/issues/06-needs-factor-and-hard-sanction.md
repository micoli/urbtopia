# 06 Knowledge Need factor and Hard Sanction

Status: ready-for-agent
Blocked by: 02

Red first:
- `knowledge` joins `NEED_FACTOR_IDS` at the Esteem level with effect `wellbeing`; per-Home satisfaction = `min(100, Knowledge * 2)`; `needsPyramid` shows it, bottleneck logic unchanged;
- `knowledge` joins `SANCTIONABLE_FACTOR_IDS` and the `hard` factors of `sanctions.json` (and its schema); not for cozy/easy/medium;
- a Hard Home at Knowledge 25 loses Tax in proportion, floored at half; Knowledge >= 50 loses nothing; never removes Citizens;
- suspended during the Adaptation period, including a Hard save made before this feature (fixture `save-v11.json` style);
- Petitions/Objectives that read Need factors stay valid (add a Petition cause only if the existing mechanism does it automatically).
