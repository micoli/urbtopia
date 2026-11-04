const texts = {
  'advisor.title': ['Advisor', 'Conseiller'],
  'advisor.close': ['Close', 'Fermer'],
  'advisor.open': ['Ask the Advisor', 'Interroger le Conseiller'],
  'advisor.explain': ['Explain', 'Expliquer'],
  'advisor.system': [
    'You are the Advisor of a city-building game. You help the Mayor understand their city. Answer in English, in at most four short sentences. Use only the city figures you are given; never invent a figure, a cause or a building. You cannot act on the city: you only explain and suggest what the Mayor could do. If the question is not about the city or its rules, say you can only talk about the city.',
    'Tu es le Conseiller d\'un jeu de construction de ville. Tu aides le Maire à comprendre sa ville. Réponds en français, en quatre phrases courtes au plus. Utilise uniquement les chiffres de la ville qui te sont donnés ; n\'invente jamais un chiffre, une cause ou un bâtiment. Tu ne peux pas agir sur la ville : tu expliques et tu suggères seulement ce que le Maire pourrait faire. Si la question ne porte pas sur la ville ou ses règles, dis que tu ne peux parler que de la ville.',
  ],
  'advisor.summary.title': ['City figures', 'Chiffres de la ville'],
  'advisor.summary.citizens': ['Citizens', 'Habitants'],
  'advisor.summary.approval': ['Approval (0-100)', 'Approbation (0-100)'],
  'advisor.summary.needs': ['Needs satisfaction (0-100)', 'Satisfaction des besoins (0-100)'],
  'advisor.summary.tiers': ['Homes by tier', 'Logements par niveau'],
  'advisor.summary.causes': ['Main causes of trouble', 'Principales causes de problèmes'],
  'advisor.summary.noCauses': ['none', 'aucune'],
  'advisor.summary.unknown': ['unknown', 'inconnu'],
  'advisor.summary.question': ['Question', 'Question'],
  'advisor.level.vital': ['Vital', 'Vital'],
  'advisor.level.safety': ['Safety', 'Sécurité'],
  'advisor.level.belonging': ['Belonging', 'Appartenance'],
  'advisor.level.esteem': ['Esteem', 'Estime'],
  'advisor.level.fulfilment': ['Fulfilment', 'Épanouissement'],
  'advisor.question.congestion': ['Why are my roads jammed?', 'Pourquoi mes routes sont-elles bouchées ?'],
  'advisor.question.waste': ['Why do my Homes lack Waste coverage?', 'Pourquoi mes logements manquent-ils de collecte des déchets ?'],
  'advisor.question.first': ['What should I do first?', 'Que dois-je faire en premier ?'],
  'advisor.question.explain': ['Explain this problem to me: {cause}', 'Explique-moi ce problème : {cause}'],
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
