import { facilityMessages } from './facilities';
import { diagnosisMessages } from './diagnosis';
import { congestionDiagnosisMessages } from './congestionDiagnosis';
import { wasteDiagnosisMessages } from './wasteDiagnosis';
import { casinoMessages } from './casino';
import { difficultyMessages } from './difficulty';
import { needsMessages } from './needs';
import { wasteSectionMessages } from './wasteSection';
import { sanctionsMessages } from './sanctions';
import { wasteCodexMessages } from './wasteCodex';
import { guideMessages } from './guide';
import { transitReachCodexMessages } from './transitReachCodex';
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
import type { MessageKey } from './messages';

export const FR: Record<MessageKey, string> = {
  ...localize(CATALOG, 'fr'),
  ...solidarityMessages('fr'),
  ...politicsMessages('fr'),
  ...politicsCodexMessages('fr'),
  ...natureMessages('fr'),
  ...challengeMessages('fr'),
  ...casinoMessages('fr'),
  ...needsMessages('fr'),
  ...wasteSectionMessages('fr'),
  ...difficultyMessages('fr'),
  ...sanctionsMessages('fr'),
  ...wasteCodexMessages('fr'),
  ...guideMessages('fr'),
  ...transitReachCodexMessages('fr'),
  ...venueMessages('fr'),
  ...buildingMessages('fr'),
  ...annualEventMessages('fr'),
  ...itemMessages('fr'),
  ...sportVenueMessages('fr'),
  ...facilityMessages('fr'),
  ...diagnosisMessages('fr'),
  ...congestionDiagnosisMessages('fr'),
  ...wasteDiagnosisMessages('fr'),
};
