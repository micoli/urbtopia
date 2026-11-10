// Closed vocabularies of Venues, bound to their rules in code.

export const STAFF_ROLES_ALL = ['manager', 'employee', 'technician', 'security', 'cashier', 'stocker', 'receptionist', 'housekeeper', 'cook', 'kitchenAssistant', 'maitreD', 'waiter', 'bartender'] as const;

export const FIXTURE_CATEGORIES_ALL = ['games', 'service', 'furniture', 'shelves', 'checkouts', 'decor', 'beds', 'bathroom', 'comfort', 'reception', 'walls', 'kitchen', 'dining', 'bar', 'power', 'plumbing', 'machines'] as const;

export type FixtureCategory = (typeof FIXTURE_CATEGORIES_ALL)[number];

// The sections of the build menu of a Factory floor, in order.
export const FACTORY_FIXTURE_CATEGORIES: readonly FixtureCategory[] = ['power', 'plumbing', 'machines', 'walls'];

// The sides of a Factory floor Fixture, seen from the Fixture itself: its front is the side its model faces.
export const FIXTURE_SIDES = ['front', 'right', 'back', 'left'] as const;

export type FixtureSide = (typeof FIXTURE_SIDES)[number];

export const FACTORY_FIXTURE_ROLES = ['motor', 'gear', 'shaft', 'bevel', 'pump', 'tank', 'pipe', 'machine'] as const;

export type FactoryFixtureRole = (typeof FACTORY_FIXTURE_ROLES)[number];

// The sections of the build menu of a Home interior, in order; they are also the groups its Comfort covers.
export const HOME_FIXTURE_CATEGORIES: readonly FixtureCategory[] = ['beds', 'bathroom', 'kitchen', 'dining', 'comfort', 'shelves', 'decor'];

// What a Fixture is in a Home interior, for the Comfort it gives: the pieces of a dwelling's daily life, and the ones that only entertain or decorate.
export const HOME_FIXTURE_ROLES = ['bed', 'table', 'chair', 'stove', 'sink', 'washer', 'toilet', 'leisure', 'decor'] as const;

export type HomeFixtureRole = (typeof HOME_FIXTURE_ROLES)[number];
