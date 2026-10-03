# Dedicated transit: BRT and railways

Status: implemented

## Confirmed decisions

- Add visually distinct BRT corridors, separate from ordinary Roads. Networks may cross without connecting.
- BRT frequency is configurable and affects ridership and operating cost. Comfort and accessibility are inherent service qualities; priority applies at crossings.
- Purchase a dedicated BRT fleet through City Management.
- Add Railways for passenger services, with Stations and configurable lines.
- Purchase electric or coal Trains through City Management. Both propulsion types use the same Railways.
- Initially, electric and coal Trains have equal speed and capacity; purchase price, energy consumption and pollution distinguish them.
- Allow perpendicular crossings between two different infrastructure networks, without connections or shared segments. Ordinary buildings still require ordinary Road access.
- Assign purchased vehicles explicitly to one line at a time. Railway lines may mix electric and coal Trains. Achievable frequency depends on fleet size and route length.
- Configure BRT peak headways from 5 to 10 minutes and off-peak headways from 10 to 15 minutes. Peak periods follow game time; ordinary Traffic yields to BRT at crossings without player-managed traffic lights.
- Coal Trains consume stored coal; electric Trains consume city-network electricity. Shortages reduce the affected service, potentially to a halt, while retaining vehicles and line configuration.
- Use dedicated BRT stations and Railway stations, with at least two stops per line and automatic shortest-path routing within the corresponding network. Disconnected lines retain configuration and become inactive.
- Support transfers between ordinary Bus lines, BRT lines and Railway lines in this version. Count each Citizen only once across public transport usage.

## Service and transfers

- Stops of any public transport modes within two tiles permit a Transfer, without an additional building. Infrastructure crossings alone do not permit Transfers.
- Allow at most two Transfers per itinerary. Choose the fastest feasible itinerary using travel, waiting and transfer time; Homes and activities may be served by different connected lines.
- Each rider consumes capacity on every line used. The most constrained line limits the itinerary; citywide ridership counts each Citizen once, while line ridership includes every rider using that line.
- Peak periods are 07:00–09:00 and 17:00–19:00 on the game clock. Headways use game minutes. Scene vehicles illustrate service without displaying every departure.
- BRT vehicles are electric and consume city-network electricity under the same shortage rules as electric Trains.
- BRT stations and Railway stations require their respective infrastructure, without requiring ordinary Road access. Citizens reach stops on foot within their coverage radius.
- Unlock BRT at 200 Citizens and railways at 600 Citizens. BRT installation is cheaper; Trains offer higher capacity. Initial prices and consumption values will be prepared during implementation and kept tunable.
- Deleting a line returns its vehicles to the unassigned Transit fleet. Vehicles may be sold for 50% of purchase price. No vehicle aging or individual maintenance in this version.

## Acceptance scenarios

- An ordinary Road and a BRT corridor cross without allowing ordinary Vehicles onto the corridor or BRT vehicles onto the Road.
- The same Railway line accepts electric and coal Trains; propulsion comes from assigned purchases, not track type.
- A Home served only by an ordinary Bus line can reach an activity served only by a Railway line through nearby transfer stops.
- A three-line itinerary uses two Transfers and capacity on all three lines, but counts its rider once citywide. An itinerary requiring three Transfers is ineligible.
- A broken connection, depleted coal stock, electricity shortage or operating-budget shortage reduces or stops affected service without deleting its configuration or purchased vehicles.
- Removing a line releases its vehicles for reassignment; selling a vehicle refunds half its purchase price.
- Existing saved cities preserve their Roads and Bus lines after migration. Live simulation and Catch-up produce equivalent transport and resource accounting.

## Design review

All interview recommendations have been accepted except postponing Transfers, which the user explicitly rejected. The user confirmed the complete scope and authorized implementation.

## Existing constraints

- Current Bus lines use automatic shortest paths and ordered Bus stops.
- Current mobility models useful coverage rather than individual Citizen journeys (ADR 0005).
- Broken lines retain configuration and become inactive (ADR 0005).
- New simulation must support deterministic Catch-up (ADR 0002).
- Saved state changes require versioned migration (ADR 0003).

## Interview

The user accepted all four first-round recommendations: aggregate BRT quality with configurable frequency, dedicated BRT fleet purchases, passenger-only railways initially, and propulsion differences limited to price, energy and pollution.

The user accepted second-round recommendations Q5–Q9 and rejected postponing transfers in Q10: transfers must be supported immediately.

The user accepted all third-round recommendations Q11–Q18: nearby transfer stops, two-transfer limit, shared line capacities, peak periods, electric BRT, dedicated station access, progression thresholds and fleet resale rules.

## Implementation and validation

- Implemented independent BRT and Railway networks, explicit dedicated-network edges, perpendicular crossings, placement/demolition tools and demolition undo.
- Implemented purchased fleet assignment/resale, peak/off-peak headways, mixed Railway propulsion, multimodal itineraries, shared line capacities and citywide rider deduplication.
- Electricity enters existing city energy accounting; coal consumption and depletion are integrated into deterministic Catch-up. Infrastructure breaks retain service configuration and fleet ownership.
- City Management and stop panels show live service status, effective headways, line ridership, fleet assignments, transfer ridership and coal usage in FR/EN.
- Save format 5 migrates earlier cities and includes a frozen mixed-propulsion fixture; the evolved city example has been regenerated.
- Railway and Train assets come from `assets/kenney/kenney_train-kit.zip`: `railroad-straight`, `railroad-corner-small`, `train-electric-city-a`, `train-electric-city-b`, `train-locomotive-a`, and `train-locomotive-passenger-a`. Track geometry is fitted to tile boundaries while retaining visible rail gauge. BRT vehicles remain procedural articulated vehicles.
- Initial balance: BRT/Railway infrastructure costs 12/24 Urbs per tile; BRT/electric Train/coal Train purchases cost 900/2400/1600 Urbs. Vehicle energy and operating costs are tunable in `src/core/transitNetwork.ts`.
- Browser verification covered a bus→BRT→Railway itinerary with 120 riders counted once citywide and on each used line, fleet purchases/assignment, mobile layout, Kenney curve continuity and a Road/Railway crossing without console errors.
- Typecheck, ESLint, the full automated suite and production build pass. Existing Vite configuration and bundle-size warnings remain.
