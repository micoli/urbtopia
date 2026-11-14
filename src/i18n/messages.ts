import { facilityMessages } from './facilities';
import { diagnosisMessages } from './diagnosis';
import { advisorMessages } from './advisor';
import { betaMessages } from './beta';
import { bugReportMessages } from './bugReport';
import { congestionDiagnosisMessages } from './congestionDiagnosis';
import { wasteDiagnosisMessages } from './wasteDiagnosis';
import { jobsDiagnosisMessages } from './jobsDiagnosis';
import { casinoMessages } from './casino';
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
import { politicsCodexMessages } from './politicsCodex';
import { CATALOG, localize } from './catalog';

export const MESSAGES = {
  ...localize(CATALOG, 'en'),
  ...solidarityMessages('en'),
  ...politicsMessages('en'),
  ...politicsCodexMessages('en'),
  ...natureMessages('en'),
  ...challengeMessages('en'),
  ...casinoMessages('en'),
  ...needsMessages('en'),
  ...wasteSectionMessages('en'),
  ...difficultyMessages('en'),
  ...sanctionsMessages('en'),
  ...wasteCodexMessages('en'),
  ...guideMessages('en'),
  ...transitReachCodexMessages('en'),
  ...recurringCostsCodexMessages('en'),
  ...environmentCodexMessages('en'),
  ...staffCodexMessages('en'),
  ...interiorsCodexMessages('en'),
  ...knowledgeCodexMessages('en'),
  ...venueMessages('en'),
  ...buildingMessages('en'),
  ...annualEventMessages('en'),
  ...itemMessages('en'),
  ...sportVenueMessages('en'),
  ...facilityMessages('en'),
  ...diagnosisMessages('en'),
  ...advisorMessages('en'),
  ...betaMessages('en'),
  ...bugReportMessages('en'),
  ...congestionDiagnosisMessages('en'),
  ...wasteDiagnosisMessages('en'),
  ...jobsDiagnosisMessages('en'),
};

export type MessageKey = keyof typeof MESSAGES;
