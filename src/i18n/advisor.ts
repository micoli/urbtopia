const texts = {
  'advisor.title': ['Advisor', 'Conseiller'],
  'advisor.close': ['Close', 'Fermer'],
  'advisor.open': ['Ask the Advisor', 'Interroger le Conseiller'],
  'advisor.explain': ['Explain', 'Expliquer'],
  'advisor.system': [
    'You are the Advisor of a city-building game. You help the Mayor understand their city.' +
    'Answer in English, in at most four short sentences.' +
    'Use only the city figures you are given; never invent a figure, a cause or a building.' +
    'You cannot act on the city: you only explain and suggest what the Mayor could do.' +
    'If the question is not about the city or its rules, say you can only talk about the city.',

    'Tu es le Conseiller d\'un jeu de construction de ville.' +
    'Tu aides le Maire à comprendre sa ville.' +
    'Réponds en français, en quatre phrases courtes au plus.' +
    'Utilise uniquement les chiffres de la ville qui te sont donnés ; n\'invente jamais un chiffre, une cause ou un bâtiment.' +
    'Tu ne peux pas agir sur la ville : tu expliques et tu suggères seulement ce que le Maire pourrait faire.' +
    'Si la question ne porte pas sur la ville ou ses règles, dis que tu ne peux parler que de la ville.',
  ],
  'advisor.summary.title': ['City figures', 'Chiffres de la ville'],
  'advisor.summary.city': ['Citizens {citizens}, Urbs {urbs}, difficulty {difficulty}, Approval {approval}/100', 'Habitants {citizens}, Urbs {urbs}, difficulté {difficulty}, Approbation {approval}/100'],
  'advisor.summary.needs': ['Needs satisfaction (0-100)', 'Satisfaction des besoins (0-100)'],
  'advisor.summary.bottleneck': ['Weakest need factor', 'Facteur de besoin le plus faible'],
  'advisor.summary.tiers': ['Homes by tier', 'Logements par niveau'],
  'advisor.summary.buildings': ['Other buildings', 'Autres bâtiments'],
  'advisor.summary.power': ['Power: demand {demand}, unmet {unmet}, produced by solar {solar}, wind {wind}, hydro {hydro}, geothermal {geothermal}, coal {coal}', 'Électricité : demande {demand}, manquant {unmet}, produit par solaire {solar}, éolien {wind}, hydraulique {hydro}, géothermie {geothermal}, charbon {coal}'],
  'advisor.summary.water': ['Water: demand {demand}, capacity {capacity}', 'Eau : demande {demand}, capacité {capacity}'],
  'advisor.summary.climate': ['Climate: temperature {temperature} °C, emissions {emissions}', 'Climat : température {temperature} °C, émissions {emissions}'],
  'advisor.summary.waste': ['Waste: produced {produced}, processed {processed}, Homes not covered {uncovered}', 'Déchets : produits {produced}, traités {processed}, logements non couverts {uncovered}'],
  'advisor.summary.traffic': ['Traffic: congestion {congestion}%, saturated road sections {saturated}, Homes cut off {disconnected}, car commuters {commuters}, public transport riders {riders}, jobs {jobs}, unemployed {unemployed}', 'Trafic : congestion {congestion} %, tronçons saturés {saturated}, logements isolés {disconnected}, pendulaires en voiture {commuters}, usagers des transports en commun {riders}, emplois {jobs}, chômeurs {unemployed}'],
  'advisor.summary.services': ['Service coverage of Citizens (%)', 'Couverture des services pour les habitants (%)'],
  'advisor.summary.knowledge': ['Knowledge (0-100): {knowledge}', 'Savoir (0-100) : {knowledge}'],
  'advisor.summary.wellbeing': ['Well-being: green cooling {cooling}, biodiversity {biodiversity}, bonus {wellbeing}, pollution malus {pollution}, missing services malus {services}, congestion malus {congestion}', 'Bien-être : fraîcheur verte {cooling}, biodiversité {biodiversity}, bonus {wellbeing}, malus pollution {pollution}, malus services manquants {services}, malus congestion {congestion}'],
  'advisor.summary.nextUnlock': ['Next unlock at {citizens} Citizens ({items} new items)', 'Prochain déblocage à {citizens} habitants ({items} nouveaux objets)'],
  'advisor.summary.ordinances': ['Adopted Ordinances', 'Ordonnances adoptées'],
  'advisor.summary.causes': ['Main causes of trouble', 'Principales causes de problèmes'],
  'advisor.summary.noCauses': ['none', 'aucune'],
  'advisor.summary.none': ['none', 'aucune'],
  'advisor.summary.unknown': ['unknown', 'inconnu'],
  'advisor.summary.question': ['Question', 'Question'],
  'advisor.category.education': ['education', 'éducation'],
  'advisor.category.administration': ['administration', 'administration'],
  'advisor.category.culture': ['culture', 'culture'],
  'advisor.category.worship': ['worship', 'culte'],
  'advisor.category.health': ['health', 'santé'],
  'advisor.category.safety': ['safety', 'sécurité'],
  'advisor.category.waste': ['waste', 'déchets'],
  'advisor.level.vital': ['Vital', 'Vital'],
  'advisor.level.safety': ['Safety', 'Sécurité'],
  'advisor.level.belonging': ['Belonging', 'Appartenance'],
  'advisor.level.esteem': ['Esteem', 'Estime'],
  'advisor.level.fulfilment': ['Fulfilment', 'Épanouissement'],
  'advisor.question.congestion': ['Why are my roads jammed?', 'Pourquoi mes routes sont-elles bouchées ?'],
  'advisor.question.waste': ['Why do my Homes lack Waste coverage?', 'Pourquoi mes logements manquent-ils de collecte des déchets ?'],
  'advisor.question.first': ['What should I do first?', 'Que dois-je faire en premier ?'],
  'advisor.question.explain': ['Explain this problem to me: {cause}', 'Explique-moi ce problème : {cause}'],
  'advisor.context.label': ['Context sent to the model', 'Contexte envoyé au modèle'],
  'advisor.context.hint': ['More context gives better-informed answers but makes them slower.', 'Plus de contexte donne des réponses mieux informées mais plus lentes.'],
  'advisor.context.level.1': ['Minimal', 'Minimal'],
  'advisor.context.level.2': ['Light', 'Léger'],
  'advisor.context.level.3': ['Balanced', 'Équilibré'],
  'advisor.context.level.4': ['Detailed', 'Détaillé'],
  'advisor.context.level.5': ['Full', 'Complet'],
  'advisor.suggestions.title': ['Suggestions', 'Suggestions'],
  'advisor.history.title': ['Recent questions', 'Questions récentes'],
  'advisor.history.clear': ['Clear the history', 'Effacer l\'historique'],
  'advisor.free.label': ['Your question', 'Votre question'],
  'advisor.free.placeholder': ['Ask about your city…', 'Posez une question sur votre ville…'],
  'advisor.send': ['Ask', 'Demander'],
  'advisor.stop': ['Stop', 'Arrêter'],
  'advisor.loading': ['Loading the Advisor…', 'Chargement du Conseiller…'],
  'advisor.thinking': ['The Advisor is thinking…', 'Le Conseiller réfléchit…'],
  'advisor.empty': ['Pick a question or write your own.', 'Choisissez une question ou écrivez la vôtre.'],
  'advisor.error.unsupported': ['This browser has no WebGPU: the Advisor is not available.', 'Ce navigateur n\'a pas WebGPU : le Conseiller n\'est pas disponible.'],
  'advisor.error.outOfMemory': ['Not enough graphics memory to run the Advisor.', 'Pas assez de mémoire graphique pour faire tourner le Conseiller.'],
  'advisor.error.network': ['The Advisor model could not be downloaded. Check your connection.', 'Le modèle du Conseiller n\'a pas pu être téléchargé. Vérifiez votre connexion.'],
  'advisor.error.unknown': ['The Advisor failed. Try again later.', 'Le Conseiller a échoué. Réessayez plus tard.'],
  'advisor.setting.label': ['Advisor', 'Conseiller'],
  'advisor.setting.description': ['An assistant that runs on your device and explains your city. Needs one download.', 'Un assistant qui tourne sur votre appareil et explique votre ville. Demande un téléchargement.'],
  'advisor.setting.downloading': ['Downloading the Advisor… {percent}%', 'Téléchargement du Conseiller… {percent} %'],
  'advisor.setting.delete': ['Delete the Advisor model', 'Supprimer le modèle du Conseiller'],
  'advisor.confirm.title': ['Download the Advisor?', 'Télécharger le Conseiller ?'],
  'advisor.confirm.body': ['The Advisor runs a language model on your device. It needs a one-time download of about {size} MB, kept in your browser, and a recent graphics card. Your city never leaves your device.', 'Le Conseiller fait tourner un modèle de langage sur votre appareil. Il demande un téléchargement unique d\'environ {size} Mo, conservé dans votre navigateur, et une carte graphique récente. Votre ville ne quitte jamais votre appareil.'],
  'advisor.confirm.download': ['Download', 'Télécharger'],
  'advisor.confirm.cancel': ['Cancel', 'Annuler'],
};

export type AdvisorMessageKey = keyof typeof texts;

export function advisorMessages(language: 'en' | 'fr'): Record<AdvisorMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<AdvisorMessageKey, string>;
}
