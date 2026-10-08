import type { FixtureId, StaffRole, VenueType } from '../core/engine/state';

type VenueMessageKey =
  | 'error.unknownFixture'
  | 'error.invalidPrice'
  | 'error.managerRequired'
  | 'error.nothingToRepair'
  | 'venue.repair'
  | 'venue.condition'
  | 'venue.broken'
  | 'venue.worn'
  | 'error.noStaffPost'
  | 'error.noStaffToRelease'
  | 'codex.fact.grid'
  | 'codex.fact.posts'
  | 'codex.fact.takingsCap'
  | 'codex.fact.fixtures'
  | 'error.invalidEventStart'
  | 'error.eventBusy'
  | 'error.eventCooldown'
  | 'error.eventStarted'
  | 'error.noEvent'
  | 'venue.events'
  | 'venue.eventTournament'
  | 'venue.eventStartsIn'
  | 'venue.eventCost'
  | 'venue.eventSchedule'
  | 'venue.eventCancel'
  | 'venue.eventScheduled'
  | 'venue.eventActive'
  | 'venue.eventCooldown'
  | 'venue.eventNeedsManager'
  | 'venue.shut'
  | 'venue.staff'
  | 'venue.wage'
  | 'venue.wages'
  | 'venue.net'
  | 'venue.closed'
  | 'venue.hire'
  | 'venue.release'
  | 'venue.priceLocked'
  | `venue.role.${StaffRole}`
  | `venue.roleEffect.${StaffRole}`
  | 'venue.attractiveness'
  | 'venue.serviceRate'
  | 'venue.hint.counterFar'
  | 'venue.hint.noise'
  | 'venue.hint.noHost'
  | 'venue.fixtureEarnings'
  | 'venue.manage'
  | 'venue.back'
  | 'venue.build'
  | 'venue.takings'
  | 'venue.collect'
  | 'venue.earnings'
  | `venue.empty.${VenueType}`
  | 'venue.chooseFixture'
  | 'venue.placeHint'
  | 'venue.moveHint'
  | 'venue.cap'
  | 'venue.tierNeeded'
  | 'venue.rotate'
  | 'venue.move'
  | 'venue.remove'
  | 'venue.entrance'
  | `venue.fixture.${FixtureId}`
  | `venue.price.${VenueType}`
  | `venue.served.${VenueType}`
  | `venue.visitors.${VenueType}`
  | `venue.capacity.${VenueType}`
  | 'error.shelfBusy'
  | 'error.shelfFull'
  | 'venue.hint.emptyShelf'
  | 'venue.hint.noBath'
  | 'venue.stock'
  | 'venue.stockGood'
  | 'venue.stockFill'
  | 'venue.stockLevel'
  | 'venue.stockNoGoods'
  | 'venue.stockNone'
  | 'venue.rooms'
  | 'venue.roomsOccupied'
  | 'venue.standing'
  | 'venue.reputation'
  | 'venue.cleanliness';

const texts: Record<VenueMessageKey, readonly [string, string]> = {
  'venue.price.arcade': ['Price of a play', 'Prix d’une partie'],
  'venue.price.supermarket': ['Markup step (10% each)', 'Marge (10 % par palier)'],
  'venue.price.hotel': ['Room rate level', 'Niveau des tarifs'],
  'venue.served.arcade': ['Plays served per hour', 'Parties servies par heure'],
  'venue.served.supermarket': ['Shoppers served per hour', 'Clients servis par heure'],
  'venue.served.hotel': ['Rooms occupied (average)', 'Chambres occupées (moyenne)'],
  'venue.visitors.arcade': ['Visitors per hour', 'Visiteurs par heure'],
  'venue.visitors.supermarket': ['Shoppers per hour', 'Clients par heure'],
  'venue.visitors.hotel': ['Guest requests per hour', 'Demandes de séjour par heure'],
  'venue.capacity.arcade': ['Plays per hour', 'Parties par heure'],
  'venue.capacity.supermarket': ['Checkout capacity per hour', 'Capacité des caisses par heure'],
  'venue.capacity.hotel': ['Complete rooms', 'Chambres complètes'],
  'error.shelfBusy': ['Empty this shelf before it holds another Good.', 'Videz ce rayon avant d’y mettre une autre marchandise.'],
  'error.shelfFull': ['This shelf is full.', 'Ce rayon est plein.'],
  'venue.hint.emptyShelf': ['Empty shelf: it sells nothing.', 'Rayon vide : il ne vend rien.'],
  'venue.hint.noBath': ['No bathroom within reach: this room counts for nothing.', 'Pas de salle de bain à portée : cette chambre ne compte pas.'],
  'venue.stock': ['Shelf', 'Rayon'],
  'venue.stockGood': ['Good on sale', 'Marchandise en vente'],
  'venue.stockFill': ['Fill from the Storehouse', 'Remplir depuis l’entrepôt'],
  'venue.stockLevel': ['Stock', 'Stock'],
  'venue.stockNoGoods': ['The Storehouse holds no Goods.', 'L’entrepôt ne contient aucune marchandise.'],
  'venue.stockNone': ['Nothing on sale', 'Rien en vente'],
  'venue.rooms': ['Complete rooms', 'Chambres complètes'],
  'venue.roomsOccupied': ['Rooms occupied', 'Chambres occupées'],
  'venue.standing': ['Standing', 'Standing'],
  'venue.reputation': ['Reputation', 'Réputation'],
  'venue.cleanliness': ['Cleanliness', 'Propreté'],
  'venue.role.cashier': ['Cashier', 'Caissier'],
  'venue.role.stocker': ['Stocker', 'Réassortisseur'],
  'venue.role.receptionist': ['Receptionist', 'Réceptionniste'],
  'venue.role.housekeeper': ['Housekeeper', 'Femme de chambre'],
  'venue.roleEffect.cashier': ['Runs the checkouts: faster service', 'Tient les caisses : service plus rapide'],
  'venue.roleEffect.stocker': ['Refills a shelf each hour from the Storehouse', 'Remplit un rayon par heure depuis l’entrepôt'],
  'venue.roleEffect.receptionist': ['Checks guests in: more stays', 'Accueille les clients : plus de séjours'],
  'venue.roleEffect.housekeeper': ['Cleans 10 rooms a day: a clean hotel keeps its reputation', 'Nettoie 10 chambres par jour : un hôtel propre garde sa réputation'],
  'venue.fixture.checkout': ['Checkout', 'Caisse'],
  'venue.fixture.shelfBags': ['Shelf of bags', 'Rayon de sachets'],
  'venue.fixture.shelfBoxes': ['Shelf of boxes', 'Rayon de cartons'],
  'venue.fixture.displayBread': ['Bread display', 'Étal de pain'],
  'venue.fixture.displayFruit': ['Fruit display', 'Étal de fruits'],
  'venue.fixture.freezer': ['Freezer', 'Congélateur'],
  'venue.fixture.freezerStanding': ['Standing freezers', 'Armoires frigorifiques'],
  'venue.fixture.shoppingBasket': ['Shopping basket', 'Panier'],
  'venue.fixture.shoppingCart': ['Shopping cart', 'Chariot'],
  'venue.fixture.bottleReturn': ['Bottle return', 'Consigne de bouteilles'],
  'venue.fixture.receptionDesk': ['Reception desk', 'Réception'],
  'venue.fixture.singleBed': ['Single bed', 'Lit simple'],
  'venue.fixture.doubleBed': ['Double bed', 'Lit double'],
  'venue.fixture.bunkBed': ['Bunk bed', 'Lits superposés'],
  'venue.fixture.toilet': ['Toilet', 'Toilettes'],
  'venue.fixture.shower': ['Shower', 'Douche'],
  'venue.fixture.bathtub': ['Bathtub', 'Baignoire'],
  'venue.fixture.sofa': ['Sofa', 'Canapé'],
  'venue.fixture.television': ['Television', 'Télévision'],
  'venue.fixture.floorLamp': ['Floor lamp', 'Lampadaire'],
  'venue.fixture.rug': ['Rug', 'Tapis'],
  'venue.fixture.pottedPlant': ['Potted plant', 'Plante en pot'],
  'venue.fixture.coffeeCorner': ['Coffee corner', 'Coin café'],
  'venue.fixture.miniFridge': ['Mini fridge', 'Mini-réfrigérateur'],
  'error.unknownFixture': ['This Fixture does not exist.', 'Cet équipement n’existe pas.'],
  'error.nothingToRepair': ['This Fixture is in perfect condition.', 'Cet équipement est en parfait état.'],
  'venue.repair': ['Repair', 'Réparer'],
  'venue.condition': ['Condition', 'État'],
  'venue.broken': ['Out of order: it earns nothing until repaired.', 'En panne : il ne rapporte rien tant qu’il n’est pas réparé.'],
  'venue.worn': ['Worn: it may break down soon.', 'Usé : il risque de tomber en panne.'],
  'error.managerRequired': ['Hire a manager first.', 'Embauchez d’abord un manager.'],
  'error.noStaffPost': ['All the posts of this role are filled.', 'Tous les postes de ce rôle sont pourvus.'],
  'error.noStaffToRelease': ['Nobody to release in this role.', 'Personne à licencier dans ce rôle.'],
  'codex.fact.grid': ['Interior', 'Intérieur'],
  'codex.fact.posts': ['Staff posts', 'Postes de personnel'],
  'codex.fact.takingsCap': ['Takings cap', 'Plafond des recettes'],
  'codex.fact.fixtures': ['Fixtures available', 'Équipements disponibles'],
  'error.invalidEventStart': ['This start time is not allowed.', 'Cette heure de début n’est pas autorisée.'],
  'error.eventBusy': ['An event is already planned.', 'Un événement est déjà prévu.'],
  'error.eventCooldown': ['The last event is too recent.', 'Le dernier événement est trop récent.'],
  'error.eventStarted': ['This event has already started.', 'Cet événement a déjà commencé.'],
  'error.noEvent': ['No event is planned.', 'Aucun événement n’est prévu.'],
  'venue.events': ['Events', 'Événements'],
  'venue.eventTournament': ['Tournament', 'Tournoi'],
  'venue.eventStartsIn': ['Starts in (hours)', 'Début dans (heures)'],
  'venue.eventCost': ['Budget', 'Budget'],
  'venue.eventSchedule': ['Schedule', 'Programmer'],
  'venue.eventCancel': ['Cancel (half refunded)', 'Annuler (moitié remboursée)'],
  'venue.eventScheduled': ['Tournament planned: more Visitors for a few hours.', 'Tournoi prévu : plus de visiteurs pendant quelques heures.'],
  'venue.eventActive': ['Tournament under way: more Visitors.', 'Tournoi en cours : plus de visiteurs.'],
  'venue.eventCooldown': ['Next event possible in', 'Prochain événement possible dans'],
  'venue.eventNeedsManager': ['Only a manager can plan events.', 'Seul un manager peut programmer des événements.'],
  'venue.shut': ['Shut: not enough power', 'Fermé : électricité insuffisante'],
  'venue.staff': ['Staff', 'Personnel'],
  'venue.wage': ['per day', 'par jour'],
  'venue.wages': ['Wages per hour', 'Salaires par heure'],
  'venue.net': ['Net per hour', 'Net par heure'],
  'venue.closed': ['Closed: the wages cannot be paid.', 'Fermé : les salaires ne peuvent pas être payés.'],
  'venue.hire': ['Hire', 'Embaucher'],
  'venue.release': ['Release', 'Licencier'],
  'venue.priceLocked': ['Only a manager can change the price.', 'Seul un manager peut changer le prix.'],
  'venue.role.manager': ['Manager', 'Manager'],
  'venue.role.employee': ['Employee', 'Employé'],
  'venue.role.technician': ['Technician', 'Technicien'],
  'venue.role.security': ['Security', 'Sécurité'],
  'venue.roleEffect.manager': ['Unlocks pricing and events, +10% yield', 'Débloque les prix et les événements, +10 % de rendement'],
  'venue.roleEffect.employee': ['Serves the counter: faster service', 'Tient le comptoir : service plus rapide'],
  'venue.roleEffect.technician': ['Repairs the machines for less, slows the wear', 'Répare les machines à moindre coût, ralentit l’usure'],
  'venue.roleEffect.security': ['Prevents incidents: keeps 10% more Visitors', 'Évite les incidents : garde 10 % de visiteurs en plus'],
  'error.invalidPrice': ['This price is not allowed.', 'Ce prix n’est pas autorisé.'],
  'venue.attractiveness': ['Attractiveness', 'Attractivité'],
  'venue.serviceRate': ['Service speed', 'Rapidité du service'],
  'venue.hint.counterFar': ['Too far from the entrance: the service slows down.', 'Trop loin de l’entrée : le service ralentit.'],
  'venue.hint.noise': ['Next to another loud machine: fewer Visitors come.', 'Collé à une autre borne bruyante : moins de visiteurs.'],
  'venue.hint.noHost': ['Needs a table next to it (or a counter for a stool).', 'Il lui faut une table à côté (ou un comptoir pour un tabouret).'],
  'venue.fixtureEarnings': ['Earns per hour', 'Rapporte par heure'],
  'venue.manage': ['Manage', 'Gérer'],
  'venue.back': ['Back to the city', 'Retour à la ville'],
  'venue.build': ['Build', 'Construire'],
  'venue.takings': ['Takings', 'Recettes'],
  'venue.collect': ['Collect', 'Encaisser'],
  'venue.earnings': ['Earnings per hour', 'Gains par heure'],
  'venue.empty.arcade': ['No game yet: nobody comes to play.', 'Aucun jeu : personne ne vient jouer.'],
  'venue.empty.supermarket': ['No checkout or nothing on the shelves: nobody buys.', 'Pas de caisse ou rien en rayon : personne n’achète.'],
  'venue.empty.hotel': ['No complete room: no guest can stay.', 'Aucune chambre complète : aucun client ne peut séjourner.'],
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
