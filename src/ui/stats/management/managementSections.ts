import type { MessageKey } from '../../../i18n/messages';
import type { IconName } from '../../common/iconRegistry';
import type { ManagementGroup } from '../../../store/uiStore';

export interface ManagementSection {
  icon: IconName;
  label: MessageKey;
  group: ManagementGroup;
}

// The sections of City management: the icon is the one of the section's heading, the group is the sub-tab that holds it.
export const MANAGEMENT_SECTIONS = {
  'eco-needs': { icon: 'needs', label: 'needs.title', group: 'overview' },
  'eco-production': { icon: 'production', label: 'eco.production', group: 'production' },
  'eco-energy': { icon: 'power', label: 'eco.energy', group: 'production' },
  'eco-water': { icon: 'water', label: 'stat.water', group: 'production' },
  'eco-services': { icon: 'services', label: 'stats.services', group: 'city' },
  'eco-jobs': { icon: 'jobs', label: 'eco.jobsSection', group: 'city' },
  'eco-nature': { icon: 'nature', label: 'build.greenSpaces', group: 'city' },
  'eco-waste': { icon: 'trash', label: 'waste.section.title', group: 'environment' },
  'eco-emissions': { icon: 'cloud', label: 'eco.emissions', group: 'environment' },
  'eco-temperature': { icon: 'temperature', label: 'eco.temperatureSection', group: 'environment' },
  'eco-traffic': { icon: 'car', label: 'eco.traffic', group: 'transport' },
  'eco-railMetro': { icon: 'rail', label: 'railMetro.title', group: 'transport' },
  'eco-transportMap': { icon: 'map', label: 'eco.transportMap', group: 'transport' },
  'eco-transport': { icon: 'transport', label: 'eco.transport', group: 'transit' },
  'eco-tourism': { icon: 'tourism', label: 'tourism.title', group: 'tourism' },
} as const satisfies Record<string, ManagementSection>;

export type ManagementSectionId = keyof typeof MANAGEMENT_SECTIONS;

export const isManagementSection = (id: string): id is ManagementSectionId => Object.hasOwn(MANAGEMENT_SECTIONS, id);

export const groupOfSection = (id: string): ManagementGroup | null => (isManagementSection(id) ? MANAGEMENT_SECTIONS[id].group : null);
