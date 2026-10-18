const texts = {
  'waste.section.title': ['Waste', 'Déchets'],
  'waste.section.help': ['Homes produce Waste in proportion to their Citizens. Facilities process it as a continuous flow, the cleanest first. All figures are per day and come from the same calculation as the simulation.', 'Les Homes produisent des déchets en proportion de leurs habitants. Les équipements les traitent en flux continu, le plus propre d’abord. Tous les chiffres sont par jour et viennent du même calcul que la simulation.'],
  'waste.section.noHomes': ['No Home produces Waste yet.', 'Aucun Home ne produit encore de déchets.'],
  'waste.section.notRequired': ['The city is still too small to be expected to handle its Waste: no Well-being malus yet.', 'La ville est encore trop petite pour devoir traiter ses déchets : pas encore de malus de bien-être.'],
  'waste.section.noFacility': ['No Waste facility is built yet.', 'Aucun équipement de déchets n’est encore construit.'],
  'waste.overview.title': ['Waste processed / produced', 'Déchets traités / produits'],
  'waste.balance.title': ['Balance of the day', 'Bilan du jour'],
  'waste.balance.produced': ['Waste produced', 'Déchets produits'],
  'waste.balance.capacity': ['Processing capacity', 'Capacité de traitement'],
  'waste.balance.processed': ['Waste processed', 'Déchets traités'],
  'waste.balance.unprocessed': ['Unprocessed Waste', 'Déchets non traités'],
  'waste.balance.cost': ['Usage cost per day', 'Coût d’usage par jour'],
  'waste.families.title': ['Facilities', 'Équipements'],
  'waste.families.buildings': ['Buildings', 'Bâtiments'],
  'waste.families.capacity': ['Capacity', 'Capacité'],
  'waste.families.processed': ['Processed', 'Traités'],
  'waste.families.cost': ['Cost per day', 'Coût par jour'],
  'waste.families.stoppedNoUrbs': ['stopped, no Urbs: {count}', 'à l’arrêt, plus d’Urbs : {count}'],
  'waste.families.stoppedPowerShortage': ['stopped, power shortage: {count}', 'à l’arrêt, pénurie d’électricité : {count}'],
  'waste.families.reducedByPower': ['reduced by a power shortage: {count}', 'réduit par une pénurie d’électricité : {count}'],
  'waste.families.stoppedNoRoad': ['stopped, no road link: {count}', 'à l’arrêt, sans lien routier : {count}'],
  'waste.coverage.title': ['Coverage', 'Couverture'],
  'waste.coverage.covered': ['Homes covered', 'Homes couverts'],
  'waste.coverage.uncovered': ['Homes not covered', 'Homes non couverts'],
  'waste.coverage.citizens': ['Citizens concerned', 'Habitants concernés'],
  'waste.coverage.all': ['Every Home is covered.', 'Tous les Homes sont couverts.'],
  'waste.cause.outOfReach': ['Out of reach', 'Hors de portée'],
  'waste.cause.capacityFull': ['Capacity full', 'Capacité saturée'],
  'waste.cause.noRoadLink': ['No road link', 'Sans lien routier'],
  'waste.cause.beyondCarryingDistance': ['Beyond the Carrying distance', 'Au-delà de la distance de portage'],
  'waste.cause.facilityStopped': ['Facility stopped, no Urbs', 'Équipement à l’arrêt, plus d’Urbs'],
  'waste.impacts.title': ['Impacts', 'Nuisances'],
  'waste.impacts.odor': ['Homes under an Odor radius', 'Homes sous une zone d’odeur'],
  'waste.impacts.incinerator': ['Homes under Incinerator smoke', 'Homes sous la fumée d’un incinérateur'],
  'waste.impacts.emissions': ['Incinerator emissions per hour', 'Émissions des incinérateurs par heure'],
  'waste.impacts.showEmissions': ['Show the Emissions', 'Voir les émissions'],
  'waste.pedestrian.title': ['Pedestrian districts', 'Quartiers piétons'],
  'waste.pedestrian.homes': ['Homes served through a Pedestrian path network', 'Homes servis par un réseau de chemins piétons'],
  'waste.pedestrian.surcharge': ['Surcharge per day', 'Surcoût par jour'],
  'waste.pedestrian.help': ['Their Waste is carried to a Road within {distance} tiles and costs {factor} times the tariff.', 'Leurs déchets sont portés jusqu’à une route à moins de {distance} cases et coûtent {factor} fois le tarif.'],
  'waste.codex.open': ['See the Waste calculations in the Codex', 'Voir les calculs des déchets dans le Codex'],
} as const satisfies Record<string, readonly [string, string]>;

export type WasteSectionMessageKey = keyof typeof texts;

export function wasteSectionMessages(language: 'en' | 'fr'): Record<WasteSectionMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<WasteSectionMessageKey, string>;
}
