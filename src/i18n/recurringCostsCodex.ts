const texts = {
  'codex.costs.title': ['Recurring costs', 'Coûts récurrents'],
  'codex.costs.intro': ['What the city pays on a schedule. Waste facilities, Backup power plants and Venue wages are on the page of each building, Tier by Tier.', 'Ce que la ville paie à intervalle régulier. Les coûts des installations de déchets, des centrales de secours et des salaires des lieux figurent sur la fiche de chaque bâtiment, niveau par niveau.'],
  'codex.cost.boats': ['Boats', 'Bateaux'],
  'codex.cost.transit': ['Transit', 'Transports'],
  'codex.cost.ordinances': ['Ordinances', 'Ordonnances'],
  'codex.cost.item': ['Item', 'Élément'],
  'codex.cost.amount': ['Cost', 'Coût'],
  'codex.cost.tier': ['Tier {tier}', 'Niveau {tier}'],
  'codex.cost.busLine': ['Bus line, while running', 'Ligne de bus en service'],
  'codex.cost.perShow': ['{amount} Urbs / Show', '{amount} Urbs / spectacle'],
} as const satisfies Record<string, readonly [string, string]>;

export type RecurringCostsCodexMessageKey = keyof typeof texts;

export function recurringCostsCodexMessages(language: 'en' | 'fr'): Record<RecurringCostsCodexMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  return Object.fromEntries(Object.entries(texts).map(([key, pair]) => [key, pair[index]])) as Record<RecurringCostsCodexMessageKey, string>;
}
