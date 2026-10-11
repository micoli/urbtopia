export const SERVICE_CATEGORIES = ['education', 'administration', 'culture', 'worship', 'health', 'safety'] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
