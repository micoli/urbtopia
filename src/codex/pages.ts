import type { MessageKey } from '../i18n/messages';
import type { CodexSection } from './catalog';

export type CodexPage = 'economy' | 'storage' | 'energy' | 'sanctions' | 'market' | 'challenges' | 'solidarity' | 'waste' | 'politics' | 'transitReach' | 'chains' | 'analytics' | 'knowledge' | 'costs' | 'dayCycle' | 'annualEvents' | 'climate' | 'staff' | 'productionInteriors' | 'serviceInteriors';

export const CODEX_PAGES: readonly { id: CodexPage; section: CodexSection; title: MessageKey; description: MessageKey }[] = [
  { id: 'economy', section: 'codex.crops', title: 'codex.economy.title', description: 'codex.economy.intro' },
  { id: 'energy', section: 'build.utilities', title: 'codex.energy.title', description: 'codex.energy.intro' },
  { id: 'chains', section: 'codex.trade', title: 'codex.chains.title', description: 'codex.chains.intro' },
  { id: 'storage', section: 'build.storage', title: 'codex.storage.title', description: 'codex.storage.intro' },
  { id: 'sanctions', section: 'build.publicFacilities', title: 'codex.sanctions.title', description: 'codex.sanctions.intro' },
  { id: 'market', section: 'codex.trade', title: 'codex.market.title', description: 'codex.market.intro' },
  { id: 'challenges', section: 'codex.trade', title: 'codex.challenges.title', description: 'codex.challenges.intro' },
  { id: 'solidarity', section: 'codex.trade', title: 'codex.solidarity.title', description: 'codex.solidarity.intro' },
  { id: 'knowledge', section: 'build.publicFacilities', title: 'codex.knowledge.title', description: 'codex.knowledge.intro' },
  { id: 'waste', section: 'build.publicFacilities', title: 'codex.waste.title', description: 'codex.waste.intro' },
  { id: 'transitReach', section: 'build.transport', title: 'codex.transitReach.title', description: 'codex.transitReach.intro' },
  { id: 'analytics', section: 'codex.roads', title: 'codex.analytics.title', description: 'codex.analytics.intro' },
  { id: 'costs', section: 'codex.trade', title: 'codex.costs.title', description: 'codex.costs.intro' },
  { id: 'dayCycle', section: 'build.utilities', title: 'codex.dayCycle.title', description: 'codex.dayCycle.intro' },
  { id: 'climate', section: 'build.utilities', title: 'codex.climate.title', description: 'codex.climate.intro' },
  { id: 'staff', section: 'build.shops', title: 'codex.staff.title', description: 'codex.staff.intro' },
  { id: 'productionInteriors', section: 'build.production', title: 'codex.productionInteriors.title', description: 'codex.productionInteriors.intro' },
  { id: 'serviceInteriors', section: 'build.publicFacilities', title: 'codex.serviceInteriors.title', description: 'codex.serviceInteriors.intro' },
  { id: 'annualEvents', section: 'build.annualEvents', title: 'codex.annualEvents.title', description: 'codex.annualEvents.intro' },
  { id: 'politics', section: 'build.publicFacilities', title: 'codex.politics.title', description: 'codex.politics.intro' },
];
