import { facilityMessages } from './facilities';
import { casinoMessages } from './casino';
import { difficultyMessages } from './difficulty';
import { needsMessages } from './needs';
import { wasteSectionMessages } from './wasteSection';
import { sanctionsMessages } from './sanctions';
import { wasteCodexMessages } from './wasteCodex';
import { venueMessages } from './venues';
import { sportVenueMessages } from './sportVenues';
import { annualEventMessages } from './annualEvents';
import { buildingMessages } from './buildings';
import { itemMessages } from './items';
import { natureMessages } from './nature';
import { challengeMessages } from './challenges';
import { solidarityMessages } from './solidarity';
import { CATALOG, localize } from './catalog';

export const MESSAGES = {
  ...localize(CATALOG, 'en'),
  ...solidarityMessages('en'),
  ...natureMessages('en'),
  ...challengeMessages('en'),
  ...casinoMessages('en'),
  ...needsMessages('en'),
  ...wasteSectionMessages('en'),
  ...difficultyMessages('en'),
  ...sanctionsMessages('en'),
  ...wasteCodexMessages('en'),
  ...venueMessages('en'),
  ...buildingMessages('en'),
  ...annualEventMessages('en'),
  ...itemMessages('en'),
  ...sportVenueMessages('en'),
  ...facilityMessages('en'),
};

export type MessageKey = keyof typeof MESSAGES;
