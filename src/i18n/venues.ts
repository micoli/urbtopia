import type { ArcadeFixtureId } from '../core/engine/state';

type VenueMessageKey =
  | 'error.unknownFixture'
  | 'error.invalidPrice'
  | 'venue.price'
  | 'venue.fixtureEarnings'
  | 'venue.served'
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
  | 'venue.moveHint'
  | 'venue.cap'
  | 'venue.tierNeeded'
  | 'venue.rotate'
  | 'venue.move'
  | 'venue.remove'
  | 'venue.entrance'
  | `venue.fixture.${ArcadeFixtureId}`;

const texts: Record<VenueMessageKey, readonly [string, string]> = {
  'error.unknownFixture': ['This Fixture does not exist.', 'Cet équipement n’existe pas.'],
  'error.invalidPrice': ['This price is not allowed.', 'Ce prix n’est pas autorisé.'],
  'venue.price': ['Price of a play', 'Prix d’une partie'],
  'venue.fixtureEarnings': ['Earns per hour', 'Rapporte par heure'],
  'venue.served': ['Plays served per hour', 'Parties servies par heure'],
  'venue.manage': ['Manage', 'Gérer'],
  'venue.back': ['Back to the city', 'Retour à la ville'],
  'venue.build': ['Build', 'Construire'],
  'venue.takings': ['Takings', 'Recettes'],
  'venue.collect': ['Collect', 'Encaisser'],
  'venue.visitors': ['Visitors per hour', 'Visiteurs par heure'],
  'venue.capacity': ['Plays per hour', 'Parties par heure'],
  'venue.earnings': ['Earnings per hour', 'Gains par heure'],
  'venue.noFixture': ['No game yet: nobody comes to play.', 'Aucun jeu : personne ne vient jouer.'],
  'venue.chooseFixture': ['Choose a Fixture to place, or tap one to edit it.', 'Choisissez un équipement à poser, ou touchez-en un pour le modifier.'],
  'venue.placeHint': ['Tap a free cell to place it.', 'Touchez une case libre pour le poser.'],
  'venue.moveHint': ['Tap a free cell to move it there.', 'Touchez une case libre pour le déplacer.'],
  'venue.cap': ['Takings are full: collect them.', 'La caisse est pleine : encaissez.'],
  'venue.tierNeeded': ['Tier', 'Niveau'],
  'venue.rotate': ['Rotate', 'Pivoter'],
  'venue.move': ['Move', 'Déplacer'],
  'venue.remove': ['Remove', 'Retirer'],
  'venue.entrance': ['Entrance', 'Entrée'],
  'venue.fixture.counter': ['Counter', 'Comptoir'],
  'venue.fixture.barrelClimber': ['Barrel climber', 'Grimpeur de tonneaux'],
  'venue.fixture.spaceShooter': ['Space shooter', 'Tir spatial'],
  'venue.fixture.airHockey': ['Air hockey table', 'Table d’air hockey'],
  'venue.fixture.table': ['Table', 'Table'],
  'venue.fixture.chair': ['Chair', 'Chaise'],
  'venue.fixture.barStool': ['Bar stool', 'Tabouret de bar'],
  'venue.fixture.pinball': ['Pinball', 'Flipper'],
  'venue.fixture.billiard': ['Billiard table', 'Table de billard'],
  'venue.fixture.vendingMachine': ['Snack machine', 'Distributeur de snacks'],
  'venue.fixture.clawMachine': ['Claw machine', 'Pince à peluches'],
  'venue.fixture.basketball': ['Basketball game', 'Jeu de basket'],
  'venue.fixture.danceMachine': ['Dance machine', 'Borne de danse'],
  'venue.fixture.prizeWheel': ['Prize wheel', 'Roue des lots'],
  'venue.fixture.ticketMachine': ['Ticket machine', 'Distributeur de tickets'],
};

export function venueMessages(language: 'en' | 'fr'): Record<VenueMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  return Object.fromEntries(Object.entries(texts).map(([key, pair]) => [key, pair[index]])) as Record<VenueMessageKey, string>;
}
