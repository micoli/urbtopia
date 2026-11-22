// Closed vocabularies of Venues, bound to their rules in code.

export const STAFF_ROLES_ALL = ['manager', 'employee', 'technician', 'security', 'cashier', 'stocker', 'receptionist', 'housekeeper', 'cook', 'kitchenAssistant', 'maitreD', 'waiter', 'bartender'] as const;

// The Staff of a Production interior or a Service interior (a Technician is counted apart, as in the Factory interior).
export const INTERIOR_ROLES_ALL = ['miller', 'spinner', 'knitter', 'herder', 'farmhand', 'irrigator', 'baker', 'seller', 'cheesemaker', 'creamMaker', 'restocker', 'stocker', 'teacher', 'librarian', 'nurse', 'doctor', 'surgeon'] as const;

// What a role of an interior carries: one part of the interior's effect.
export const INTERIOR_PARTS_ALL = ['speed', 'yield', 'salesRate', 'cheeseYield', 'creamYield', 'capacity', 'schooling', 'restock', 'knowledge', 'carePrimary', 'careDoctor', 'careSurgeon'] as const;

export const INTERIOR_FAMILIES_ALL = ['production', 'service'] as const;

export const FIXTURE_CATEGORIES_ALL = ['games', 'service', 'furniture', 'shelves', 'checkouts', 'decor', 'beds', 'bathroom', 'comfort', 'reception', 'walls', 'kitchen', 'dining', 'bar', 'power', 'plumbing', 'machines', 'line'] as const;

export type FixtureCategory = (typeof FIXTURE_CATEGORIES_ALL)[number];

// The sections of the build menu of a Factory interior, in order.
export const FACTORY_FIXTURE_CATEGORIES: readonly FixtureCategory[] = ['power', 'plumbing', 'machines', 'walls'];

// The sections of the build menu of a Textile mill interior, in order: a Drive and Machines, with no Flow.
export const TEXTILE_FIXTURE_CATEGORIES: readonly FixtureCategory[] = ['power', 'machines', 'walls'];

// The sections of the build menu of a Packhouse interior, in order.
export const PACKHOUSE_FIXTURE_CATEGORIES: readonly FixtureCategory[] = ['power', 'machines', 'line', 'walls'];

// The sections of the build menu of a Production interior that runs a Line of crates, in order: the Bakery, the Dairy and the Storehouse.
export const LINE_FIXTURE_CATEGORIES: readonly FixtureCategory[] = ['power', 'plumbing', 'machines', 'line', 'walls'];

// The Production interiors that share the engine of the Factory interior, by the kind of their Fixtures.
export const PRODUCTION_INTERIOR_KINDS = ['factory', 'packhouse', 'mill', 'bakery', 'dairy', 'storehouse', 'workshop', 'recyclingPlant', 'textileMill', 'knitwearFactory', 'livestockFarm', 'farm', 'coalPlant', 'geothermalPlant', 'hydroPlant'] as const;

// The sections of the build menu of an Engine room, in order: the Machines and the wall ports, then the links (Conveyors, pipes and Cables).
export const ENGINE_ROOM_FIXTURE_CATEGORIES: readonly FixtureCategory[] = ['machines', 'line', 'walls'];

// What passes through a port. Drive turns the Machines of a Factory interior and a Gear passes it on through its axle ends or meshes with another Gear's rim (gear);
// Flow is what its Pumps push through Pipes; Packets travel a Line; the others are carried by the links of the Circuits of an Engine room.
export const FIXTURE_MEDIA = ['coal', 'water', 'steam', 'electricity', 'smoke', 'drive', 'gear', 'flow', 'line'] as const;

export type FixtureMedium = (typeof FIXTURE_MEDIA)[number];

// Whether a port takes its Medium in, gives it out, or does both (a pipe, a Cable).
export const PORT_DIRECTIONS = ['in', 'out', 'both'] as const;

export type PortDirection = (typeof PORT_DIRECTIONS)[number];

export interface FixturePort {
  side: FixtureSide;
  medium: FixtureMedium;
  direction: PortDirection;
  // The Fixture works without this port being linked; linking it adds something (the smoke of a Steam boiler to a Filter).
  optional?: true;
}

// The Service interiors, by the kind of their Fixtures.
export const SERVICE_INTERIOR_KINDS = ['school', 'library', 'hospital'] as const;

export const isServiceInteriorKind = (kind: string): kind is (typeof SERVICE_INTERIOR_KINDS)[number] => (SERVICE_INTERIOR_KINDS as readonly string[]).includes(kind);

export const isProductionInteriorKind = (kind: string): kind is (typeof PRODUCTION_INTERIOR_KINDS)[number] => (PRODUCTION_INTERIOR_KINDS as readonly string[]).includes(kind);

// The sections of the build menu of the Service interiors, in order.
export const SCHOOL_FIXTURE_CATEGORIES: readonly FixtureCategory[] = ['furniture', 'shelves', 'decor', 'walls'];
export const LIBRARY_FIXTURE_CATEGORIES: readonly FixtureCategory[] = ['shelves', 'furniture', 'comfort', 'walls'];
export const HOSPITAL_FIXTURE_CATEGORIES: readonly FixtureCategory[] = ['beds', 'service', 'furniture', 'walls'];

// The sides of a Factory interior Fixture, seen from the Fixture itself: its front is the side its model faces.
export const FIXTURE_SIDES = ['front', 'right', 'back', 'left'] as const;

export type FixtureSide = (typeof FIXTURE_SIDES)[number];

// A Conveyor, a Scanner and an Exit belong to the Line of a Packhouse interior.
// A Fixture of an Engine room has the role `circuit`: it takes no Drive and no Flow, only the links of its ports.
export const FACTORY_FIXTURE_ROLES = ['motor', 'gear', 'shaft', 'bevel', 'pump', 'tank', 'pipe', 'machine', 'conveyor', 'scanner', 'exit', 'circuit'] as const;

// The sizes of packed Goods an Exit serves.
export const PACK_SIZES = ['Crate', 'Box', 'Pallet'] as const;

export type PackSize = (typeof PACK_SIZES)[number];

export type FactoryFixtureRole = (typeof FACTORY_FIXTURE_ROLES)[number];

// The sections of the build menu of a Home interior, in order; they are also the groups its Comfort covers.
export const HOME_FIXTURE_CATEGORIES: readonly FixtureCategory[] = ['beds', 'bathroom', 'kitchen', 'dining', 'comfort', 'shelves', 'decor', 'walls'];

// What a Fixture is in a Home interior, for the Comfort it gives: the pieces of a dwelling's daily life, and the ones that only entertain or decorate.
export const HOME_FIXTURE_ROLES = ['bed', 'table', 'chair', 'stove', 'sink', 'washer', 'toilet', 'leisure', 'decor'] as const;

export type HomeFixtureRole = (typeof HOME_FIXTURE_ROLES)[number];

// Every place a Fixture can stand: a Venue, a Home interior, a Service interior or a Production interior.
export const FIXTURE_VENUES = ['arcade', 'supermarket', 'hotel', 'restaurant', 'home', ...SERVICE_INTERIOR_KINDS, ...PRODUCTION_INTERIOR_KINDS] as const;

export type FixtureVenueKind = (typeof FIXTURE_VENUES)[number];

// The numbers a Fixture adds to what its venue earns, serves, holds or draws. Each is read by the code of the venue that declares it.
export const FIXTURE_EFFECTS = [
  'speed', 'yield', 'sales', 'capacity', 'coolant', 'draw', 'strength', 'power', 'quality', 'comfort', 'attract', 'checkout', 'cook', 'shelf', 'playsPerHour', 'seats', 'drinks', 'stools', 'waiting', 'sleeps', 'bath', 'generation', 'cleaner',
] as const;

export type FixtureEffect = (typeof FIXTURE_EFFECTS)[number];

// What a Fixture is, besides numbers: a flag when it has no value, a word when it has one.
export const FIXTURE_TRAITS = ['heat', 'prep', 'reception', 'picks', 'loud', 'reverses', 'turns', 'seat', 'packSize', 'assigns', 'yieldGroup'] as const;

export type FixtureTrait = (typeof FIXTURE_TRAITS)[number];
