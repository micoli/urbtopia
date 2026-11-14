const texts = {
  'codex.productionInteriors.title': ['Production interiors', 'Intérieurs de production'],
  'codex.productionInteriors.intro': [
    'The Factory, the Packhouse, the Mill, the Bakery, the Dairy and the Storehouse can be fitted out from the inside. Motors, Machines and Lines add speed, yield, sales or room to the building. The figures below come straight from the rules, and the last part of each interior shows what yours brings right now.',
    'L’usine, le conditionnement, la minoterie, la boulangerie, la laiterie et l’entrepôt peuvent être aménagés de l’intérieur. Moteurs, machines et chaînes ajoutent de la vitesse, du rendement, des ventes ou de la place au bâtiment. Les chiffres ci-dessous viennent directement des règles, et la dernière partie de chaque intérieur montre ce que le vôtre apporte en ce moment.',
  ],
  'codex.serviceInteriors.title': ['Service interiors', 'Intérieurs de service'],
  'codex.serviceInteriors.intro': [
    'The School, the Library and the Hospital can be furnished from the inside. Furniture adds quality, up to a cap that rises with the Tier, and Staff deliver it to the homes served. The figures below come straight from the rules, and the last part of each interior shows what yours brings right now.',
    'L’école, la bibliothèque et l’hôpital peuvent être meublés de l’intérieur. Le mobilier ajoute de la qualité, jusqu’à un plafond qui monte avec le niveau, et le personnel la délivre aux logements desservis. Les chiffres ci-dessous viennent directement des règles, et la dernière partie de chaque intérieur montre ce que le vôtre apporte en ce moment.',
  ],
  'codex.interiors.unlockOpen': ['Open: the city has the {citizens} Citizens it needs.', 'Ouvert : la ville a les {citizens} habitants requis.'],
  'codex.interiors.unlockLocked': ['Opens once the city has {citizens} Citizens.', 'S’ouvre quand la ville compte {citizens} habitants.'],
  'codex.interiors.benefits': ['Benefits by Tier', 'Bénéfices par niveau'],
  'codex.interiors.benefitsHelp': [
    'The most the interior can add at each Tier of the building. A bonus counts in full up to a share of that cap, then grows less and less with every piece, and never reaches it.',
    'Le maximum que l’intérieur peut ajouter à chaque niveau du bâtiment. Un bonus compte en entier jusqu’à une part de ce plafond, puis croît de moins en moins à chaque pièce, sans jamais l’atteindre.',
  ],
  'codex.interiors.tier': ['Tier', 'Niveau'],
  'codex.interiors.room': ['Room (tiles)', 'Salle (cases)'],
  'codex.interiors.sales': ['Sales rate', 'Cadence de vente'],
  'codex.interiors.capacity': ['Room for Goods', 'Place pour les biens'],
  'codex.interiors.exits': ['Exits of each size', 'Sorties de chaque taille'],
  'codex.interiors.quality': ['Quality of the service', 'Qualité du service'],
  'codex.interiors.staff': ['Staff', 'Personnel'],
  'codex.interiors.staffHelp': ['Posts that can be hired at each Tier, from Tier 1.', 'Postes qui peuvent être pourvus à chaque niveau, dès le niveau 1.'],
  'codex.interiors.role': ['Role', 'Rôle'],
  'codex.interiors.posts': ['Posts', 'Postes'],
  'codex.interiors.example': ['Example set-up', 'Exemple de montage'],
  'codex.interiors.exampleTier': ['Room of a Tier {tier} building', 'Salle d’un bâtiment de niveau {tier}'],
  'codex.interiors.yours': ['In your city', 'Dans votre ville'],
  'codex.interiors.none': ['No interior is fitted out in your city yet.', 'Aucun intérieur n’est encore aménagé dans votre ville.'],
  'codex.interiors.liveRow': ['Tier {tier} · {fixtures} pieces', 'Niveau {tier} · {fixtures} pièces'],
  'codex.interiors.furniture': ['Quality of the furniture', 'Qualité du mobilier'],
  'codex.interiors.part.speed': ['Speed', 'Vitesse'],
  'codex.interiors.part.salesRate': ['Sales rate', 'Cadence de vente'],
  'codex.interiors.part.cheeseYield': ['Cheese yield', 'Rendement en fromage'],
  'codex.interiors.part.creamYield': ['Cream yield', 'Rendement en crème'],
  'codex.interiors.part.capacity': ['Room for Goods', 'Place pour les biens'],
  'codex.interiors.part.schooling': ['Schooling delivered', 'Scolarisation délivrée'],
  'codex.interiors.part.knowledge': ['Knowledge delivered', 'Savoir délivré'],
  'codex.interiors.part.carePrimary': ['Primary care delivered', 'Soins courants délivrés'],
  'codex.interiors.part.careDoctor': ['Medical care delivered', 'Soins médicaux délivrés'],
  'codex.interiors.part.careSurgeon': ['Surgical care delivered', 'Soins chirurgicaux délivrés'],
} as const satisfies Record<string, readonly [string, string]>;

export type InteriorsCodexMessageKey = keyof typeof texts;

export function interiorsCodexMessages(language: 'en' | 'fr'): Record<InteriorsCodexMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  return Object.fromEntries(Object.entries(texts).map(([key, pair]) => [key, pair[index]])) as Record<InteriorsCodexMessageKey, string>;
}
