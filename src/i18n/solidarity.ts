const texts = {
  'solidarity.title': ['Solidarity', 'Solidarité'],
  'solidarity.donate': ['Donate', 'Donner'],
  'solidarity.cancel': ['Cancel', 'Annuler'],
  'solidarity.confirm': ['Donate {quantity} × {good}', 'Donner {quantity} × {good}'],
  'solidarity.quantity': ['Quantity to donate', 'Quantité à donner'],
  'solidarity.stock': ['{quantity} × {good} will leave your stock. No Urbs received.', '{quantity} × {good} quitteront votre stock. Aucun Urb reçu.'],
  'solidarity.value': ['Donation value: {value}', 'Valeur du don : {value}'],
  'solidarity.added': ['Solidarity gained: {duration} (h:mm:ss)', 'Solidarité ajoutée : {duration} (h:mm:ss)'],
  'solidarity.after': ['Reserve after donation: {duration} (h:mm:ss)', 'Réserve après le don : {duration} (h:mm:ss)'],
  'solidarity.excess': ['{value} of this donation will count only towards your Medal: the reserve is capped at 24 hours.', '{value} de ce don compteront uniquement pour votre médaille : la réserve est plafonnée à 24 heures.'],
  'solidarity.full': ['Solidarity is at its maximum. This donation will count only towards your Medal.', 'Solidarité au maximum. Ce don comptera uniquement pour votre médaille.'],
  'solidarity.active': ['Active: +{bonus} Well-being across the city. Remaining: {duration} (h:mm:ss).', 'Active : +{bonus} de bien-être dans toute la ville. Temps restant : {duration} (h:mm:ss).'],
  'solidarity.inactive': ['Donate Goods to associations for a temporary city-wide Well-being bonus.', 'Donnez des marchandises à des associations pour un bonus temporaire de bien-être dans toute la ville.'],
  'solidarity.openCodex': ['How solidarity works', 'Comprendre la solidarité'],
  'solidarity.medal.title': ['Solidary city', 'Ville solidaire'],
  'solidarity.medal.progress': ['Total donation value: {value} / {target} — next tier: {tier}', 'Valeur cumulée des dons : {value} / {target} — prochain palier : {tier}'],
  'solidarity.medal.gold': ['Gold achieved — total donation value: {value}', 'Or atteint — valeur cumulée des dons : {value}'],
  'solidarity.medal.projected': ['Medal progress after this donation', 'Progression de la médaille après ce don'],
  'solidarity.tier.bronze': ['Bronze', 'Bronze'],
  'solidarity.tier.silver': ['Silver', 'Argent'],
  'solidarity.tier.gold': ['Gold', 'Or'],
  'solidarity.pending': ['{value} donation value awaiting account synchronization.', '{value} de valeur de dons en attente de synchronisation avec le compte.'],
  'solidarity.signIn': ['Sign in and choose a handle to keep your Medal on your profile across cities.', 'Connectez-vous et choisissez un pseudo pour conserver votre médaille sur votre profil entre vos villes.'],
  'solidarity.syncFailed': ['Medal synchronization is pending. Your donations are saved on this device and will be retried.', 'La médaille reste à synchroniser. Vos dons sont conservés sur cet appareil et seront renvoyés.'],
  'needs.factor.solidarity': ['Solidarity', 'Solidarité'],
  'needs.by.solidarity': ['Optional donations to associations', 'Dons facultatifs à des associations'],
  'needs.measure.solidarity': ['Temporary Well-being bonus; excluded from the needs average', 'Bonus temporaire de bien-être ; hors moyenne des besoins'],
  'codex.solidarity.title': ['Solidarity and donations', 'Solidarité et dons'],
  'codex.solidarity.intro': ['From the Market, choose Donate beside a Good, set the quantity, and review the preview before confirming. Goods leave your stock immediately and you receive no Urbs. Materials cannot be donated.', 'Au marché, choisissez Donner à côté d’une marchandise, réglez la quantité et consultez l’aperçu avant de confirmer. Les marchandises quittent immédiatement votre stock et ne rapportent aucun Urb. Les matériaux ne peuvent pas être donnés.'],
  'codex.solidarity.value': ['Each donation is valued at the Goods’ fixed base value, independently of current Market prices. This value fills the reserve and advances your Medal.', 'Chaque don est évalué à la valeur de base fixe des marchandises, indépendamment des prix actuels du marché. Cette valeur remplit la réserve et fait progresser votre médaille.'],
  'codex.solidarity.reserveTitle': ['A temporary reserve for the whole city', 'Une réserve temporaire pour toute la ville'],
  'codex.solidarity.reserve': ['While the reserve is positive, every Home gains +{bonus} Well-being, within the existing cap of 100. Solidarity is an optional Belonging bonus: not donating never lowers the satisfaction of your Needs or causes a Sanction. Further donations extend the duration without stacking the bonus.', 'Tant que la réserve est positive, chaque Home gagne +{bonus} de bien-être, dans la limite habituelle de 100. La solidarité est un bonus facultatif d’appartenance : ne pas donner ne réduit jamais la satisfaction des besoins et ne provoque aucune sanction. Les dons suivants prolongent la durée sans cumuler les bonus.'],
  'codex.solidarity.cost': ['Filling an empty reserve buys 24 hours and requires donation value equal to twice the Citizen count, with a minimum of 200. Smaller donations add a proportional duration. The reserve can never exceed 24 hours; population changes do not shorten time already acquired.', 'Remplir une réserve vide procure 24 heures et demande une valeur de dons égale à deux fois le nombre d’habitants, avec un minimum de 200. Les petits dons ajoutent une durée proportionnelle. La réserve ne dépasse jamais 24 heures ; un changement de population ne raccourcit pas le temps déjà acquis.'],
  'codex.solidarity.clock': ['Time is consumed during normal play, while offline, and during Time skips. An 8-hour Time skip consumes 8 hours of reserve. The bonus stops as soon as the reserve runs out.', 'Le temps s’écoule en jeu, hors connexion et pendant les sauts temporels. Un saut de 8 heures consomme 8 heures de réserve. Le bonus s’arrête dès que la réserve est épuisée.'],
  'codex.solidarity.exampleTitle': ['Example', 'Exemple'],
  'codex.solidarity.example': ['With 100 Citizens, donating Goods worth 50 adds 6 hours. With 1,000 Citizens, the same value adds 36 minutes. Each donation still adds 50 towards the Medal.', 'Avec 100 habitants, donner des marchandises d’une valeur de 50 ajoute 6 heures. Avec 1 000 habitants, la même valeur ajoute 36 minutes. Chaque don ajoute toujours 50 à la progression de la médaille.'],
  'codex.solidarity.excess': ['You can donate even with a full reserve. Any value exceeding the 24-hour cap counts only towards the Medal. The preview identifies this excess before you confirm.', 'Vous pouvez donner même si la réserve est pleine. La valeur dépassant le plafond de 24 heures compte uniquement pour la médaille. L’aperçu indique cet excédent avant votre confirmation.'],
  'codex.solidarity.medalTitle': ['A permanent Medal', 'Une médaille permanente'],
  'codex.solidarity.medal': ['The Solidary city Medal evolves through Bronze at 1,000 cumulative donation value, Silver at 10,000 and Gold at 100,000. It appears on your social profile and your Friends can see it. Signed-in progress belongs to your account across cities and city resets; each city keeps its own temporary reserve.', 'La médaille Ville solidaire évolue : bronze à 1 000 de valeur cumulée donnée, argent à 10 000 et or à 100 000. Elle figure sur votre profil social et vos amis peuvent la voir. La progression connectée appartient à votre compte et survit aux nouvelles villes ; chaque ville garde sa propre réserve temporaire.'],
  'codex.solidarity.offline': ['Offline donations are saved on this device and synchronized when you reconnect. Sign in and choose a handle to attach the Medal to your account.', 'Les dons hors connexion sont conservés sur cet appareil et synchronisés à la reconnexion. Connectez-vous et choisissez un pseudo pour rattacher la médaille à votre compte.'],
} as const satisfies Record<string, readonly [string, string]>;

export type SolidarityMessageKey = keyof typeof texts;

export function solidarityMessages(language: 'en' | 'fr'): Record<SolidarityMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  return Object.fromEntries(Object.entries(texts).map(([key, pair]) => [key, pair[index]])) as Record<SolidarityMessageKey, string>;
}
