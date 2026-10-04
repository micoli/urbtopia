import { CASINO, MAX_CASINO_TIER, casinoPower, casinoRadius, maxStake } from '../core/leisure/casino';

type CasinoMessageKey =
  | 'building.casino'
  | 'codex.description.casino'
  | 'event.unlocked.casino'
  | 'build.leisure'
  | 'error.casinoExpansionBlocked'
  | 'error.casinoShut'
  | 'error.invalidStake'
  | 'casino.slotMachine'
  | 'casino.blackjack'
  | 'casino.blockmatch'
  | 'casino.powered'
  | 'casino.shut'
  | 'casino.maxStake'
  | 'casino.stake'
  | 'casino.balance'
  | 'casino.spin'
  | 'casino.won'
  | 'casino.lost'
  | 'casino.even'
  | 'casino.close'
  | 'error.noOpenRound'
  | 'error.invalidRound'
  | 'casino.deal'
  | 'casino.feltRule'
  | 'casino.handWon'
  | 'casino.handLost'
  | 'casino.hit'
  | 'casino.stand'
  | 'casino.double'
  | 'casino.dealer'
  | 'casino.player'
  | 'casino.naturalWin'
  | 'casino.push'
  | 'casino.bust'
  | 'casino.newRound'
  | 'casino.leaveConfirm'
  | 'casino.keepPlaying'
  | 'casino.leaveAnyway'
  | 'home.leisure'
  | 'home.leisureNone'
  | 'casino.demand'
  | 'casino.wellbeingGain'
  | 'casino.moves'
  | 'casino.unlocksNext'
  | 'casino.maxTier';

const texts: Record<CasinoMessageKey, readonly [string, string]> = {
  'building.casino': ['Casino', 'Casino'],
  'codex.description.casino': ['', ''],
  'event.unlocked.casino': ['New leisure building available: Casino.', 'Nouveau bâtiment de loisirs disponible : Casino.'],
  'build.leisure': ['Leisure', 'Loisirs'],
  'error.casinoExpansionBlocked': [
    'This Casino needs more space to upgrade. A road or building blocks its expansion: clear that space or move the Casino.',
    'Ce casino doit s’agrandir pour évoluer. Une route ou un bâtiment occupe l’espace nécessaire : libérez cet espace ou déplacez le casino.',
  ],
  'error.casinoShut': ['This Casino is shut: it is not powered.', 'Ce casino est fermé : il n’est pas alimenté en électricité.'],
  'error.invalidStake': ['This Stake is not allowed at this Casino Tier.', 'Cette mise n’est pas autorisée à ce niveau de casino.'],
  'casino.slotMachine': ['Slot machine', 'Machine à sous'],
  'casino.blackjack': ['Blackjack', 'Blackjack'],
  'casino.blockmatch': ['Blockmatch', 'Blockmatch'],
  'casino.powered': ['Open', 'Ouvert'],
  'casino.shut': ['Shut: not enough power', 'Fermé : électricité insuffisante'],
  'casino.maxStake': ['Highest Stake', 'Mise maximale'],
  'casino.stake': ['Stake', 'Mise'],
  'casino.balance': ['Balance', 'Solde'],
  'casino.spin': ['Spin', 'Lancer'],
  'casino.won': ['You won', 'Vous gagnez'],
  'casino.lost': ['You lost', 'Vous perdez'],
  'casino.even': ['Stake returned', 'Mise rendue'],
  'casino.close': ['Leave', 'Quitter'],
  'error.noOpenRound': ['There is no round to settle.', 'Aucune manche à régler.'],
  'error.invalidRound': ['This round cannot be settled.', 'Cette manche ne peut pas être réglée.'],
  'casino.deal': ['Deal', 'Distribuer'],
  'casino.feltRule': ['Blackjack pays 3 to 2 · Dealer stands on 17', 'Blackjack payé 3 pour 2 · Le croupier reste à 17'],
  'casino.handWon': ['Your hand wins', 'Votre main gagne'],
  'casino.handLost': ['Dealer wins', 'Le croupier gagne'],
  'casino.hit': ['Hit', 'Tirer'],
  'casino.stand': ['Stand', 'Rester'],
  'casino.double': ['Double', 'Doubler'],
  'casino.dealer': ['Dealer', 'Croupier'],
  'casino.player': ['You', 'Vous'],
  'casino.naturalWin': ['Blackjack!', 'Blackjack !'],
  'casino.push': ['Push: stake returned', 'Égalité : mise rendue'],
  'casino.bust': ['Bust', 'Bust'],
  'casino.newRound': ['New round', 'Nouvelle manche'],
  'casino.leaveConfirm': ['The round is not over: your Stake will be lost.', 'La manche n’est pas terminée : votre mise sera perdue.'],
  'casino.keepPlaying': ['Keep playing', 'Continuer'],
  'casino.leaveAnyway': ['Leave and lose the Stake', 'Quitter et perdre la mise'],
  'home.leisure': ['Leisure', 'Loisirs'],
  'home.leisureNone': ['none', 'aucun'],
  'casino.demand': ['Casino power demand', 'Électricité des casinos'],
  'casino.wellbeingGain': ['Well-being from Leisure', 'Bien-être des loisirs'],
  'casino.moves': ['moves', 'coups'],
  'casino.unlocksNext': ['Next Tier unlocks', 'Le niveau suivant débloque'],
  'casino.maxTier': ['Highest Tier reached', 'Niveau maximal atteint'],
};

function description(index: number): string {
  const radius = casinoRadius(1);
  const power = casinoPower(1);
  return index === 0
    ? `A Leisure building where Citizens play Minigames with Urbs. It raises the Well-being of Homes in a ${2 * radius}-tile square around it, but needs much power and shuts down when it is not powered. Tier 1: slot machine; Tier 2: blackjack; Tier 3: blockmatch; up to Tier ${MAX_CASINO_TIER} (highest Stake ${maxStake(MAX_CASINO_TIER)}). Demand ${power} power; unlocks at ${CASINO.unlockCitizens} Citizens, costs ${CASINO.cost} Urbs.`
    : `Un bâtiment de loisirs où les citoyens jouent à des mini-jeux avec des Urbs. Il augmente le bien-être des logements à moins de ${2 * radius} cases, mais consomme beaucoup d’électricité et ferme s’il n’est pas alimenté. Niveau 1 : machine à sous ; niveau 2 : blackjack ; niveau 3 : blockmatch ; jusqu’au niveau ${MAX_CASINO_TIER} (mise maximale ${maxStake(MAX_CASINO_TIER)}). Consomme ${power} d’électricité ; se débloque à ${CASINO.unlockCitizens} citoyens, coûte ${CASINO.cost} Urbs.`;
}

export function casinoMessages(language: 'en' | 'fr'): Record<CasinoMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, key === 'codex.description.casino' ? description(index) : pair[index]]);
  return Object.fromEntries(entries) as Record<CasinoMessageKey, string>;
}
