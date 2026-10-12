const texts = {
  'codex.sanctions.title': ['Sanctions', 'Sanctions'],
  'codex.sanctions.intro': ['A Home whose Citizens lack a basic need pays less Tax. The Difficulty of the city decides which needs count. Only the weakest of them applies to a Home, and its Tax never falls below the floor of the Difficulty.', 'Un Home dont les habitants manquent d’un besoin de base paie moins d’impôts. La difficulté de la ville décide des besoins qui comptent. Seul le plus faible s’applique à un Home, et ses impôts ne tombent jamais sous le plancher de la difficulté.'],
  'codex.sanctions.city': ['Your city', 'Votre ville'],
  'codex.sanctions.current': ['Difficulty: {difficulty}', 'Difficulté : {difficulty}'],
  'codex.sanctions.byDifficulty': ['By Difficulty', 'Par difficulté'],
  'codex.sanctions.factor': ['Need factor', 'Facteur de besoin'],
  'codex.sanctions.sanctioned': ['Sanctioned', 'Sanctionné'],
  'codex.sanctions.notSanctioned': ['Not sanctioned', 'Non sanctionné'],
  'codex.sanctions.taxFloor': ['Tax kept at worst', 'Impôts conservés au pire'],
  'codex.sanctions.citizenLoss': ['Citizens leaving', 'Habitants qui partent'],
  'codex.sanctions.noSanction': ['No Sanction', 'Aucune Sanction'],
  'codex.sanctions.noCitizenLoss': ['None', 'Aucun'],
  'codex.sanctions.climateNote': ['Climate only sanctions a Home with no Green space in its reach.', 'Le climat ne sanctionne qu’un Home sans espace vert à sa portée.'],
  'codex.sanctions.electricityNote': ['Under Cozy, a power shortage still lowers the Tax of the Homes it leaves unpowered. From the first Difficulty that sanctions Electricity, it becomes a Sanction, with a floor.', 'En Cozy, une pénurie d’électricité réduit encore les impôts des Homes qu’elle prive de courant. Dès la première difficulté qui sanctionne l’électricité, elle devient une Sanction, avec un plancher.'],
  'codex.sanctions.adapting': ['Sanctions are suspended during the Adaptation period ({hours} h left).', 'Les Sanctions sont suspendues pendant la période d’adaptation ({hours} h restantes).'],
  'codex.sanctions.cozyCity': ['Your city is on Cozy: nothing is sanctioned.', 'Votre ville est en Cozy : rien n’est sanctionné.'],
  'codex.sanctions.noHome': ['No Home is sanctioned.', 'Aucun Home n’est sanctionné.'],
  'codex.sanctions.homes': ['Sanctioned Homes', 'Homes sanctionnés'],
  'codex.sanctions.home': ['Home', 'Home'],
  'codex.sanctions.cause': ['Weakest factor', 'Facteur le plus faible'],
  'codex.sanctions.satisfaction': ['Satisfaction', 'Satisfaction'],
  'codex.sanctions.lost': ['Tax lost per hour', 'Impôts perdus par heure'],
  'codex.sanctions.more': ['and {count} more', 'et {count} de plus'],
} as const satisfies Record<string, readonly [string, string]>;

export type SanctionsMessageKey = keyof typeof texts;

export function sanctionsMessages(language: 'en' | 'fr'): Record<SanctionsMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<SanctionsMessageKey, string>;
}
