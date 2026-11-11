// Closed vocabularies of Venues, bound to their rules in code.

export const STAFF_ROLES_ALL = ['manager', 'employee', 'technician', 'security', 'cashier', 'stocker', 'receptionist', 'housekeeper', 'cook', 'kitchenAssistant', 'maitreD', 'waiter', 'bartender'] as const;

// The Staff of a Production interior or a Service interior (a Technician is counted apart, as in the Factory interior).
export const INTERIOR_ROLES_ALL = ['miller', 'baker', 'seller', 'cheesemaker', 'creamMaker', 'stocker', 'teacher', 'librarian', 'nurse', 'doctor', 'surgeon'] as const;

// What a role of an interior carries: one part of the interior's effect.
export const INTERIOR_PARTS_ALL = ['speed', 'salesRate', 'cheeseYield', 'creamYield', 'capacity', 'schooling', 'knowledge', 'carePrimary', 'careDoctor', 'careSurgeon'] as const;

export const INTERIOR_FAMILIES_ALL = ['production', 'service'] as const;

export const FIXTURE_CATEGORIES_ALL = ['games', 'service', 'furniture', 'shelves', 'checkouts', 'decor', 'beds', 'bathroom', 'comfort', 'reception', 'walls', 'kitchen', 'dining', 'bar', 'power', 'plumbing', 'machines', 'line'] as const;

export type FixtureCategory = (typeof FIXTURE_CATEGORIES_ALL)[number];

// The sections of the build menu of a Factory interior, in order.
export const FACTORY_FIXTURE_CATEGORIES: readonly FixtureCategory[] = ['power', 'plumbing', 'machines', 'walls'];

// The sections of the build menu of a Packhouse interior, in order.
export const PACKHOUSE_FIXTURE_CATEGORIES: readonly FixtureCategory[] = ['power', 'machines', 'line', 'walls'];

// The sections of the build menu of a Production interior that runs a Line of crates, in order: the Bakery, the Dairy and the Storehouse.
export const LINE_FIXTURE_CATEGORIES: readonly FixtureCategory[] = ['power', 'plumbing', 'machines', 'line', 'walls'];

// The Production interiors that share the engine of the Factory interior, by the kind of their Fixtures.
export const PRODUCTION_INTERIOR_KINDS = ['factory', 'packhouse', 'mill', 'bakery', 'dairy', 'storehouse'] as const;

export const isProductionInteriorKind = (kind: string): kind is (typeof PRODUCTION_INTERIOR_KINDS)[number] => (PRODUCTION_INTERIOR_KINDS as readonly string[]).includes(kind);

// The sides of a Factory interior Fixture, seen from the Fixture itself: its front is the side its model faces.
export const FIXTURE_SIDES = ['front', 'right', 'back', 'left'] as const;

export type FixtureSide = (typeof FIXTURE_SIDES)[number];

// A Conveyor, a Scanner and an Exit belong to the Line of a Packhouse interior.
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
