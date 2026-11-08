const texts = {
  'codex.staff.title': ['Venue staff', 'Personnel des lieux'],
  'codex.staff.intro': ['Every role hired in a Venue changes how it works. The figures below come straight from the rules of the game.', 'Chaque rôle embauché dans un lieu change son fonctionnement. Les chiffres ci-dessous viennent directement des règles du jeu.'],
  'codex.staff.wage': ['Wage per day', 'Salaire par jour'],
  'codex.staff.hireFee': ['Hiring fee', 'Frais d’embauche'],
  'codex.staff.venues': ['Hired in', 'Embauché dans'],
  'codex.staff.venueTier': ['{venue} (from tier {tier})', '{venue} (dès le niveau {tier})'],
  'codex.staff.effects': ['Effects', 'Effets'],
  'codex.staff.effect.front': ['Serves the front desk: the Venue serves {base}% of its Visitors alone, +{perHire}% for each hire, up to 100% with {full}.', 'Tient l’accueil : le lieu sert {base} % de ses visiteurs seul, +{perHire} % par embauche, jusqu’à 100 % avec {full}.'],
  'codex.staff.effect.managerPrices': ['Unlocks the pricing and the events of the Venue.', 'Débloque les prix et les événements du lieu.'],
  'codex.staff.effect.managerYield': ['Adds {bonus}% to the yield of the Venue.', 'Ajoute {bonus} % au rendement du lieu.'],
  'codex.staff.effect.technicianRepair': ['Repairs cost {saved}% less.', 'Les réparations coûtent {saved} % de moins.'],
  'codex.staff.effect.technicianWear': ['Slows the wear of the machines by {saved}%.', 'Ralentit l’usure des machines de {saved} %.'],
  'codex.staff.effect.security': ['Without security the Venue loses {loss}% of its Visitors.', 'Sans sécurité, le lieu perd {loss} % de ses visiteurs.'],
  'codex.staff.effect.stocker': ['Every {minutes} minutes, refills the emptiest shelves from the Storehouse, up to {units} units a pass ({perHour} an hour). Several shelves can share the budget.', 'Toutes les {minutes} minutes, remplit les rayons les plus vides depuis l’entrepôt, jusqu’à {units} unités par passage ({perHour} par heure). Plusieurs rayons peuvent se partager le budget.'],
  'codex.staff.effect.stockerFee': ['Each unit placed costs a handling fee of {fee}% of its value, paid from the Takings.', 'Chaque unité posée coûte des frais de manutention de {fee} % de sa valeur, payés sur les recettes.'],
  'codex.staff.effect.receptionist': ['Without reception, only {without}% of the stays are taken.', 'Sans réception, seulement {without} % des séjours sont pris.'],
  'codex.staff.effect.housekeeper': ['Cleans {rooms} rooms a day: a clean hotel keeps its reputation.', 'Nettoie {rooms} chambres par jour : un hôtel propre garde sa réputation.'],
  'codex.staff.effect.cook': ['Runs the cooktops: without a cook, the kitchen works at {without}%.', 'Tient les plaques : sans cuisinier, la cuisine tourne à {without} %.'],
  'codex.staff.effect.kitchenAssistant': ['Each assistant adds {boost}% to the output of the kitchen.', 'Chaque commis ajoute {boost} % à la production de la cuisine.'],
  'codex.staff.effect.waiter': ['Each waiter serves {covers} covers an hour; without one, only {without}.', 'Chaque serveur sert {covers} couverts par heure ; sans serveur, seulement {without}.'],
  'codex.staff.effect.bartender': ['Runs the bar: without a bartender, it works at {without}%.', 'Tient le bar : sans barman, il tourne à {without} %.'],
} as const satisfies Record<string, readonly [string, string]>;

export type StaffCodexMessageKey = keyof typeof texts;

export function staffCodexMessages(language: 'en' | 'fr'): Record<StaffCodexMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  return Object.fromEntries(Object.entries(texts).map(([key, pair]) => [key, pair[index]])) as Record<StaffCodexMessageKey, string>;
}
