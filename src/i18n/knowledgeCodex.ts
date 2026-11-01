const texts = {
  'codex.knowledge.title': ['Knowledge', 'Savoir'],
  'codex.knowledge.intro': ['Schools and Libraries give each Home Knowledge from 0 to 100. The Knowledge of the whole city, weighted by Citizens, makes the city work better; under Hard Difficulty, a Home that lacks it pays less Tax.', 'Les écoles et les bibliothèques donnent à chaque logement un savoir de 0 à 100. Le savoir de toute la ville, pondéré par les habitants, fait mieux fonctionner la ville ; en difficulté Difficile, un logement qui en manque verse moins d’impôts.'],
  'codex.knowledge.city': ['The city today', 'La ville aujourd’hui'],
  'codex.knowledge.cityKnowledge': ['Knowledge of the city', 'Savoir de la ville'],
  'codex.knowledge.noCitizens': ['No Citizens yet', 'Pas encore d’habitants'],
  'codex.knowledge.homesBelow': ['Homes below the required Knowledge', 'Logements sous le savoir requis'],
  'codex.knowledge.sources': ['What builds Knowledge', 'Ce qui construit le savoir'],
  'codex.knowledge.sourcesHelp': ['Each School degree counts once, whatever the number of Schools of that degree. Only the best Library reaching a Home counts. Schooling and Library combine so that only both reach 100.', 'Chaque degré d’école compte une fois, quel que soit le nombre d’écoles de ce degré. Seule la meilleure bibliothèque qui atteint un logement compte. Scolarité et bibliothèque se combinent : seules les deux ensemble atteignent 100.'],
  'codex.knowledge.source': ['Source', 'Source'],
  'codex.knowledge.points': ['Points', 'Points'],
  'codex.knowledge.libraryTier': ['Library, Tier {tier}', 'Bibliothèque, niveau {tier}'],
  'codex.knowledge.effects': ['What Knowledge gives', 'Ce que donne le savoir'],
  'codex.knowledge.effectsHelp': ['Each effect grows with the Knowledge of the city, quickly at first: half of the maximum Knowledge already gives about 70% of the effect.', 'Chaque effet croît avec le savoir de la ville, vite au début : la moitié du savoir maximal donne déjà environ 70 % de l’effet.'],
  'codex.knowledge.effect': ['Effect', 'Effet'],
  'codex.knowledge.maximum': ['At Knowledge 100', 'À savoir 100'],
  'codex.knowledge.current': ['Now', 'Maintenant'],
  'codex.knowledge.effect.production': ['Faster Industry buildings', 'Bâtiments industriels plus rapides'],
  'codex.knowledge.effect.office': ['More Urbs from Offices', 'Plus d’Urbs des bureaux'],
  'codex.knowledge.effect.tax': ['More Tax', 'Plus d’impôts'],
  'codex.knowledge.effect.wellbeing': ['Well-being (points)', 'Bien-être (points)'],
  'codex.knowledge.effect.waste': ['Less Waste per Citizen', 'Moins de déchets par habitant'],
  'codex.knowledge.effect.power': ['Less power Demand, so fewer emissions', 'Moins de demande d’électricité, donc moins d’émissions'],
  'codex.knowledge.sanction': ['Under Hard Difficulty', 'En difficulté Difficile'],
  'codex.knowledge.sanctionHelp': ['A Home whose Knowledge is below {required} pays less Tax, in proportion to the shortfall, down to half of its Tax. The four School degrees are enough to reach it without a Library. The Sanction is suspended during an Adaptation period.', 'Un logement dont le savoir est sous {required} verse moins d’impôts, en proportion du manque, jusqu’à la moitié de ses impôts. Les quatre degrés d’école suffisent à l’atteindre sans bibliothèque. La sanction est suspendue pendant une période d’adaptation.'],
} as const;

export type KnowledgeCodexMessageKey = keyof typeof texts;

export function knowledgeCodexMessages(language: 'en' | 'fr'): Record<KnowledgeCodexMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<KnowledgeCodexMessageKey, string>;
}
