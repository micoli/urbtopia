import { architectMessages } from './architect';
import { facilityMessages } from './facilities';
import { diagnosisMessages } from './diagnosis';
import { advisorMessages } from './advisor';
import { betaMessages } from './beta';
import { bugReportMessages } from './bugReport';
import { congestionDiagnosisMessages } from './congestionDiagnosis';
import { wasteDiagnosisMessages } from './wasteDiagnosis';
import { jobsDiagnosisMessages } from './jobsDiagnosis';
import { casinoMessages } from './casino';
import { puzzleMessages } from './puzzle';
import { difficultyMessages } from './difficulty';
import { needsMessages } from './needs';
import { wasteSectionMessages } from './wasteSection';
import { sanctionsMessages } from './sanctions';
import { wasteCodexMessages } from './wasteCodex';
import { guideMessages } from './guide';
import { transitReachCodexMessages } from './transitReachCodex';
import { recurringCostsCodexMessages } from './recurringCostsCodex';
import { environmentCodexMessages } from './environmentCodex';
import { staffCodexMessages } from './staffCodex';
import { interiorsCodexMessages } from './interiorsCodex';
import { fixturesCodexMessages } from './fixturesCodex';
import { knowledgeCodexMessages } from './knowledgeCodex';
import { venueMessages } from './venues';
import { sportVenueMessages } from './sportVenues';
import { annualEventMessages } from './annualEvents';
import { buildingMessages } from './buildings';
import { itemMessages } from './items';
import { natureMessages } from './nature';
import { challengeMessages } from './challenges';
import { solidarityMessages } from './solidarity';
import { politicsMessages } from './politics';
import { achievementMessages } from './achievements';
import { politicsCodexMessages } from './politicsCodex';
import { CATALOG, localize } from './catalog';
import type { MessageKey } from './messages';

export const FR: Record<MessageKey, string> = {
  ...localize(CATALOG, 'fr'),
  ...solidarityMessages('fr'),
  ...politicsMessages('fr'),
  ...achievementMessages('fr'),
  ...politicsCodexMessages('fr'),
  ...natureMessages('fr'),
  ...challengeMessages('fr'),
  ...casinoMessages('fr'),
  ...puzzleMessages('fr'),
  ...needsMessages('fr'),
  ...wasteSectionMessages('fr'),
  ...difficultyMessages('fr'),
  ...sanctionsMessages('fr'),
  ...wasteCodexMessages('fr'),
  ...guideMessages('fr'),
  ...transitReachCodexMessages('fr'),
  ...recurringCostsCodexMessages('fr'),
  ...environmentCodexMessages('fr'),
  ...staffCodexMessages('fr'),
  ...interiorsCodexMessages('fr'),
  ...fixturesCodexMessages('fr'),
  ...knowledgeCodexMessages('fr'),
  ...venueMessages('fr'),
  ...buildingMessages('fr'),
  ...annualEventMessages('fr'),
  ...itemMessages('fr'),
  ...sportVenueMessages('fr'),
  ...facilityMessages('fr'),
  ...diagnosisMessages('fr'),
  ...advisorMessages('fr'),
  ...betaMessages('fr'),
  ...bugReportMessages('fr'),
  ...congestionDiagnosisMessages('fr'),
  ...wasteDiagnosisMessages('fr'),
  ...jobsDiagnosisMessages('fr'),
  ...architectMessages('fr'),
};
