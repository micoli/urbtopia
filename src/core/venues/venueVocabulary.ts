// Closed vocabularies of Venues, bound to their rules in code.

export const STAFF_ROLES_ALL = ['manager', 'employee', 'technician', 'security', 'cashier', 'stocker', 'receptionist', 'housekeeper', 'cook', 'kitchenAssistant', 'maitreD', 'waiter', 'bartender'] as const;

export const FIXTURE_CATEGORIES_ALL = ['games', 'service', 'furniture', 'shelves', 'checkouts', 'decor', 'beds', 'bathroom', 'comfort', 'reception', 'walls', 'kitchen', 'dining', 'bar', 'power', 'plumbing', 'machines'] as const;

export type FixtureCategory = (typeof FIXTURE_CATEGORIES_ALL)[number];

// The sides of a Factory floor Fixture, seen from the Fixture itself: its front is the side its model faces.
export const FIXTURE_SIDES = ['front', 'right', 'back', 'left'] as const;

export type FixtureSide = (typeof FIXTURE_SIDES)[number];

export const FACTORY_FIXTURE_ROLES = ['motor', 'gear', 'shaft', 'pump', 'pipe', 'machine'] as const;

export type FactoryFixtureRole = (typeof FACTORY_FIXTURE_ROLES)[number];
