
type VenueMessageKey =
  | 'venue.manage'
  | 'venue.back'
  | 'venue.build'
  | 'venue.takings'
  | 'venue.collect'
  | 'venue.visitors'
  | 'venue.capacity'
  | 'venue.earnings'
  | 'venue.noFixture'
  | 'venue.chooseFixture'
  | 'venue.placeHint'
  | 'venue.fixture.arcadeMachine'
  | 'venue.cap';

const texts: Record<VenueMessageKey, readonly [string, string]> = {
  'venue.manage': ['Manage', 'Gérer'],
  'venue.back': ['Back to the city', 'Retour à la ville'],
  'venue.build': ['Build', 'Construire'],
  'venue.takings': ['Takings', 'Recettes'],
  'venue.collect': ['Collect', 'Encaisser'],
  'venue.visitors': ['Visitors per hour', 'Visiteurs par heure'],
  'venue.capacity': ['Plays per hour', 'Parties par heure'],
  'venue.earnings': ['Earnings per hour', 'Gains par heure'],
  'venue.noFixture': ['No Fixture yet: nobody comes to play.', 'Aucun équipement : personne ne vient jouer.'],
  'venue.chooseFixture': ['Choose a Fixture to place.', 'Choisissez un équipement à poser.'],
  'venue.placeHint': ['Tap a free cell to place it.', 'Touchez une case libre pour le poser.'],
  'venue.fixture.arcadeMachine': ['Arcade machine', 'Borne d’arcade'],
  'venue.cap': ['Takings are full: collect them.', 'La caisse est pleine : encaissez.'],
};

export function venueMessages(language: 'en' | 'fr'): Record<VenueMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  return Object.fromEntries(Object.entries(texts).map(([key, pair]) => [key, pair[index]])) as Record<VenueMessageKey, string>;
}
