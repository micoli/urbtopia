export const SERVICE_CATEGORIES = ['education', 'administration', 'culture', 'worship', 'health', 'safety', 'waste'] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
