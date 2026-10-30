# Tourism and leisure

Attractions draw Tourists who earn Urbs and load the transport network; Gatherings (Shows and Matches) bring crowds; the Concert hall books Artists; football and baseball stadiums host Clubs run from a management page. Vocabulary: see `CONTEXT.md` (Tourist, Attraction, Ticket, Gathering, Show, Match, Artist, Fame, Club, Squad, Championship). Decision: ADR 0052.

## Rules

- Attractions: the 5 Museums, Colosseum, athletics, football and baseball stadiums, Concert hall, Theater, Casino, Marina with its Boats, Ferris wheel and Roller coaster. A Hotel is not one: it lodges Tourists (longer stay, higher spending).
- Each Attraction declares its drawing power in its building definition; Tiers raise it. City attractiveness reuses the existing `cityAttractiveness`, which counts every Attraction as a leisure place.
- A visit earns about 3 Tickets (`TOURISM.spendingPerEntry`), so that a mid-sized Attraction pays back in 3 to 6 days and a landmark in 2 to 3 weeks; a Gathering's sales stay at 1 Ticket each.
- Tourists have no Home. They enter by Railway stations and Transit hubs, else by road, and reach Attractions on foot, as Riders or by car. Aggregate only, never saved.
- Ticket: 3 levels per Attraction. Higher Ticket earns more per entry and draws fewer. Proceeds build up as Takings (capped by Tier, collected by hand), like Venues.
- Gathering: a Show (Theater, Concert hall, Colosseum, programmed by the player) or a Match (stadiums, on a Championship calendar). Costs Urbs, cooldown per Attraction. Crowd = capacity x fill, fill from quality, Ticket and Well-being; the surplus splits between Tourists and Citizens in reach.
- A Show starts now or in 1 to 24 hours, and can be cancelled before it starts for half of its cost back. Its forecast states crowd, sales, cost and profit, per Artist in the Concert hall.
- Crowd arrives in the hour before and leaves in the hour after (game hour). Poor transit never loses Tourists: it adds Congestion and a temporary, moderate Well-being malus nearby. Never blocking.
- Concert hall Shows: 100 invented Artists (`artists.json`), Fame 1 to 5. The Fame ceiling follows mean Well-being and population. The player picks one among 3 offered. Higher Fame: bigger crowd, higher Ticket, higher fee.
- Clubs: football and baseball. One sport-agnostic engine (Squad of individual players with age and contract, budget fed by stadium Takings, Championship, ranking, prize); sports supply positions, formations and the Match simulation. First version: Squad, lineup, yearly recruitment of 6 players from a market; 7 aggregate opposing clubs with invented names. Full transfer market later, same save format.
- A Match on the management page plays at a speed the player sets with a slider, about 90 seconds by default, from 6 minutes to 12 seconds; the choice is kept in the preferences. At baseball the score and the feed follow the plays shown on the field.
- Championship: one game year, about 10 Matches. Prize in Urbs and extra Tourists at the end. No relegation, no bankruptcy: a Club in debt loses its best players.
- Football: 18 players, 11 starters, 4 formations, Match streamed as a text feed with tactic changes and 3 substitutions. Baseball: 9 starters, starting pitcher chosen per Match, batting order, 9 innings.

## Playing it

- The side panel of an Attraction compares the three Tickets (Tourists and Urbs per hour), shows when the Takings fill up and how Tourists come. Clubs aside, every panel states the phase and the time left of a Gathering, then its result.
- The Tourism section of City management sums up the city: Tourists, Urbs per hour, Takings to collect, attractiveness, spending, what to do next, the events to come, and each Attraction with a shortcut to it.
- On the map, a Gathering has a badge with its phase and time left, its crowd gathers around the building and searchlights sweep during it. Each Attraction keeps a few visitors around it. These figures are a picture of the aggregate, never saved.
- The toasts of a Gathering name the building and jump to it.

## Out of scope

Real names (artists, clubs, cities), full transfer market, opposing Squads, new sports, Tourists as individuals in the simulation.
