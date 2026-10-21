const texts = {
  'codex.transitReach.title': ['Transit reach', 'Portée par transport'],
  'codex.transitReach.intro': ['A Home beyond the reach of a Public facility is still covered when a BRT station, Railway station or Transit hub near the facility is linked, within the maximum travel time, by a Transit itinerary to one near the Home. It uses the same Citizen capacity as direct reach, and Homes in direct reach are served first.', 'Un Home hors de la portée d’un équipement public est quand même couvert quand une station BHNS, une gare ou un pôle d’échange proche de l’équipement est relié, dans le temps de trajet maximal, par un itinéraire de transport à une station proche du Home. La capacité en habitants est la même que pour la portée directe, et les Homes à portée directe sont servis en premier.'],
  'codex.transitReach.rules': ['Rules', 'Règles'],
  'codex.transitReach.maxMinutes': ['Maximum travel time (minutes)', 'Temps de trajet maximal (minutes)'],
  'codex.transitReach.stopTypes': ['Stops that extend reach', 'Arrêts qui étendent la portée'],
  'codex.transitReach.excluded': ['Not extended', 'Non étendu'],
  'codex.transitReach.rulesHelp': ['Travel time counts vehicle time, waiting and Transfers, not the walk to the stop. Ordinary Bus stops never extend reach. A line serves reach only while its route is connected and a vehicle is assigned to it.', 'Le temps de trajet compte le temps en véhicule, l’attente et les correspondances, pas la marche jusqu’à l’arrêt. Les arrêts de bus ordinaires n’étendent jamais la portée. Une ligne n’étend la portée que si son itinéraire est connecté et qu’un véhicule lui est affecté.'],
  'codex.transitReach.network': ['Network', 'Réseau'],
  'codex.transitReach.lines': ['Lines serving reach', 'Lignes qui étendent la portée'],
  'codex.transitReach.stops': ['Stops serving reach', 'Arrêts qui étendent la portée'],
  'codex.transitReach.noLine': ['No line serves reach yet: build a BRT or Railway line and assign it a vehicle.', 'Aucune ligne n’étend encore la portée : créez une ligne BHNS ou ferroviaire et affectez-lui un véhicule.'],
  'codex.transitReach.categories': ['Coverage by Service category', 'Couverture par catégorie de service'],
  'codex.transitReach.category': ['Category', 'Catégorie'],
  'codex.transitReach.facilities': ['Facilities', 'Équipements'],
  'codex.transitReach.direct': ['Homes in direct reach', 'Homes à portée directe'],
  'codex.transitReach.viaTransit': ['Homes through transit', 'Homes via le transport'],
  'codex.transitReach.noFacility': ['No Public facility extended by transit is built yet.', 'Aucun équipement public étendu par le transport n’est encore construit.'],
  'codex.transitReach.perFacility': ['Homes reached through transit, per facility', 'Homes atteints via le transport, par équipement'],
  'codex.transitReach.facility': ['Facility', 'Équipement'],
  'codex.transitReach.homes': ['Homes', 'Homes'],
} as const;

export type TransitReachCodexMessageKey = keyof typeof texts;

export function transitReachCodexMessages(language: 'en' | 'fr'): Record<TransitReachCodexMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<TransitReachCodexMessageKey, string>;
}
