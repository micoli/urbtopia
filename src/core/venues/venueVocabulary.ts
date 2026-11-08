// Closed vocabularies of Venues, bound to their rules in code.

export const STAFF_ROLES_ALL = ['manager', 'employee', 'technician', 'security', 'cashier', 'stocker', 'receptionist', 'housekeeper', 'cook', 'kitchenAssistant', 'maitreD', 'waiter', 'bartender'] as const;

export const FIXTURE_CATEGORIES_ALL = ['games', 'service', 'furniture', 'shelves', 'checkouts', 'decor', 'beds', 'bathroom', 'comfort', 'reception', 'walls', 'kitchen', 'dining', 'bar'] as const;

export type FixtureCategory = (typeof FIXTURE_CATEGORIES_ALL)[number];
