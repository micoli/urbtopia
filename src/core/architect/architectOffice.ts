import type { Building } from '../engine/state';

export const isArchitectOffice = (building: Building): boolean => building.type === 'architectOffice';
