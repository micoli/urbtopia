// Closed vocabularies of Venues, bound to their rules in code.

export const STAFF_ROLES_ALL = ['manager', 'employee', 'technician', 'security', 'cashier', 'stocker', 'receptionist', 'housekeeper', 'cook', 'kitchenAssistant', 'maitreD', 'waiter', 'bartender'] as const;

export const FIXTURE_CATEGORIES_ALL = ['games', 'service', 'furniture', 'shelves', 'checkouts', 'decor', 'beds', 'bathroom', 'comfort', 'reception', 'walls', 'kitchen', 'dining', 'bar', 'power', 'plumbing', 'machines', 'line'] as const;

export type FixtureCategory = (typeof FIXTURE_CATEGORIES_ALL)[number];

// The sections of the build menu of a Factory floor, in order.
export const FACTORY_FIXTURE_CATEGORIES: readonly FixtureCategory[] = ['power', 'plumbing', 'machines', 'walls'];

// The sections of the build menu of a Packhouse floor, in order.
export const PACKHOUSE_FIXTURE_CATEGORIES: readonly FixtureCategory[] = ['power', 'machines', 'line', 'walls'];

// The sides of a Factory floor Fixture, seen from the Fixture itself: its front is the side its model faces.
export const FIXTURE_SIDES = ['front', 'right', 'back', 'left'] as const;

export type FixtureSide = (typeof FIXTURE_SIDES)[number];

// A Conveyor, a Scanner and an Exit belong to the Line of a Packhouse floor.
export const FACTORY_FIXTURE_ROLES = ['motor', 'gear', 'shaft', 'bevel', 'pump', 'tank', 'pipe', 'machine', 'conveyor', 'scanner', 'exit'] as const;

// The sizes of packed Goods an Exit serves.
export const PACK_SIZES = ['Crate', 'Box', 'Pallet'] as const;

export type PackSize = (typeof PACK_SIZES)[number];

export type FactoryFixtureRole = (typeof FACTORY_FIXTURE_ROLES)[number];

// The sections of the build menu of a Home interior, in order; they are also the groups its Comfort covers.
export const HOME_FIXTURE_CATEGORIES: readonly FixtureCategory[] = ['beds', 'bathroom', 'kitchen', 'dining', 'comfort', 'shelves', 'decor', 'walls'];

// What a Fixture is in a Home interior, for the Comfort it gives: the pieces of a dwelling's daily life, and the ones that only entertain or decorate.
export const HOME_FIXTURE_ROLES = ['bed', 'table', 'chair', 'stove', 'sink', 'washer', 'toilet', 'leisure', 'decor'] as const;

export type HomeFixtureRole = (typeof HOME_FIXTURE_ROLES)[number];
