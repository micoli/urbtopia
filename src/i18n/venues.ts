import type { FixtureId, StaffRole, VenueType } from '../core/engine/state';
import { FIXTURE_ENTRIES, type FixtureCategory } from '../core/venues/fixtures';

type VenueMessageKey =
  | 'error.unknownFixture'
  | 'error.invalidPrice'
  | 'error.invalidArtist'
  | 'error.unknownPlayer'
  | 'error.notEnoughBudget'
  | 'error.squadFull'
  | 'error.squadTooSmall'
  | 'error.noClub'
  | 'error.invalidLineup'
  | 'error.noFixture'
  | 'error.matchNotStarted'
  | 'error.clubExists'
  | 'error.managerRequired'
  | 'error.rankTooLow'
  | 'venue.rank'
  | 'venue.rankNeeded'
  | 'venue.eventNeedsRank'
  | 'venue.hireFee'
  | 'error.nothingToRepair'
  | 'venue.repair'
  | 'venue.condition'
  | 'venue.wear'
  | 'venue.broken'
  | 'venue.worn'
  | 'error.noStaffPost'
  | 'error.noStaffToRelease'
  | 'codex.fact.grid'
  | 'codex.fact.posts'
  | 'codex.fact.takingsCap'
  | 'codex.fact.fixtures'
  | 'codex.fact.floorGrid'
  | 'codex.fact.floorSpeedCap'
  | 'codex.fact.floorYieldCap'
  | 'codex.fact.technicianPosts'
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
  | 'home.interior.open'
  | 'home.interior.comfort'
  | 'home.interior.wellbeing'
  | 'home.interior.wellbeingShort'
  | 'factory.floor.open'
  | 'factory.floor.linked'
  | 'factory.floor.speed'
  | 'factory.floor.yield'
  | 'factory.floor.power'
  | 'factory.floor.motorLoad'
  | 'factory.floor.benefit.own'
  | 'factory.floor.benefit.cooled'
  | 'factory.floor.benefit.vat'
  | 'factory.floor.benefit.vatIdle'
  | 'factory.floor.benefit.doubled'
  | 'factory.floor.benefit.boiler'
  | 'factory.floor.benefit.boilerIdle'
  | 'factory.floor.benefit.boilerPower'
  | 'factory.floor.benefit.motorCooled'
  | 'factory.floor.benefit.motorIdle'
  | 'factory.floor.benefit.variety'
  | 'factory.floor.hint'
  | 'factory.floor.optional'
  | 'factory.floor.linkedMachine'
  | 'factory.floor.problem.noDrive'
  | 'factory.floor.problem.wrongTurn'
  | 'factory.floor.problem.jammed'
  | 'factory.floor.problem.noFlow'
  | 'factory.floor.problem.overloaded'
  | 'factory.floor.problem.tankFull'
  | 'factory.floor.motorOverloaded'
  | 'venue.cancel'
  | 'venue.menu.back'
  | 'venue.fixture.panel'
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
  | `venue.category.${FixtureCategory}`
  | `venue.price.${VenueType}`
  | `venue.served.${VenueType}`
  | `venue.visitors.${VenueType}`
  | `venue.capacity.${VenueType}`
  | 'error.shelfBusy'
  | 'error.shelfFull'
  | 'error.menuFull'
  | 'venue.menu'
  | 'venue.menuHint'
  | 'venue.menuEmpty'
  | 'venue.menuFamilyCount'
  | 'venue.menuOutOfStock'
  | 'venue.menuAdd'
  | 'venue.menuRemove'
  | 'venue.family.dairy'
  | 'venue.family.bakery'
  | 'venue.family.sea'
  | 'venue.family.farm'
  | 'venue.family.orchard'
  | 'venue.family.sweet'
  | 'venue.hint.emptyShelf'
  | 'venue.hint.noBath'
  | 'venue.stock'
  | 'venue.stockGood'
  | 'venue.inStorage'
  | 'venue.stockFill'
  | 'venue.stockRemove'
  | 'venue.stockLevel'
  | 'venue.stockNoGoods'
  | 'venue.stockNone'
  | 'venue.rooms'
  | 'venue.roomsOccupied'
  | 'venue.standing'
  | 'venue.reputation'
  | 'venue.cleanliness';

const texts: Record<Exclude<VenueMessageKey, `venue.fixture.${FixtureId}`>, readonly [string, string]> = {
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
  'venue.price.restaurant': ['Markup step (10% each)', 'Marge (10 % par palier)'],
  'venue.served.restaurant': ['Diners served per hour', 'Clients servis par heure'],
  'venue.visitors.restaurant': ['Diners per hour', 'Clients par heure'],
  'venue.capacity.restaurant': ['Covers per hour', 'Couverts par heure'],
  'venue.role.cook': ['Cook', 'Cuisinier'],
  'venue.role.kitchenAssistant': ['Kitchen assistant', 'Commis de cuisine'],
  'venue.role.maitreD': ['Maître d’', 'Maître d’hôtel'],
  'venue.role.waiter': ['Waiter', 'Serveur'],
  'venue.role.bartender': ['Bartender', 'Barman'],
  'venue.roleEffect.cook': ['Runs the cooktops: without one, the kitchen works at a third', 'Tient les plaques : sans cuisinier, la cuisine tourne au tiers'],
  'venue.roleEffect.kitchenAssistant': ['Helps the cook: +25% of kitchen output', 'Aide le cuisinier : +25 % de production en cuisine'],
  'venue.roleEffect.maitreD': ['Welcomes Diners: more of them come in', 'Accueille les clients : plus d’entrées'],
  'venue.roleEffect.waiter': ['Serves 8 covers an hour; without one, only 3', 'Sert 8 couverts par heure ; sans serveur, seulement 3'],
  'venue.roleEffect.bartender': ['Runs the bar: without one, it works at a third', 'Tient le bar : sans barman, il tourne au tiers'],
  'venue.category.kitchen': ['Kitchen', 'Cuisine'],
  'venue.category.dining': ['Dining room', 'Salle'],
  'venue.category.bar': ['Bar', 'Bar'],
  'error.menuFull': ['The Menu has no free slot at this Tier.', 'Le menu n’a plus de place à ce niveau.'],
  'venue.menu': ['Menu', 'Menu'],
  'venue.menuHint': ['Pick the ingredients the kitchen cooks. Each Diner eats one unit taken from the Storehouse; more families please more Diners.', 'Choisissez les ingrédients que la cuisine prépare. Chaque client mange une unité prise dans l’entrepôt ; plus de familles contentent plus de clients.'],
  'venue.menuEmpty': ['Nothing on the Menu: no Diner is served.', 'Rien au menu : aucun client n’est servi.'],
  'venue.menuFamilyCount': ['families on the Menu', 'familles au menu'],
  'venue.menuOutOfStock': ['out of stock', 'en rupture'],
  'venue.menuAdd': ['Add to the Menu', 'Ajouter au menu'],
  'venue.menuRemove': ['Take off the Menu', 'Retirer du menu'],
  'venue.family.dairy': ['Dairy', 'Laitages'],
  'venue.family.bakery': ['Bakery', 'Boulangerie'],
  'venue.family.sea': ['Sea', 'Mer'],
  'venue.family.farm': ['Eggs', 'Œufs'],
  'venue.family.orchard': ['Orchard', 'Verger'],
  'venue.family.sweet': ['Sweet', 'Douceurs'],
  'venue.hint.emptyShelf': ['Empty shelf: it sells nothing.', 'Rayon vide : il ne vend rien.'],
  'venue.hint.noBath': ['No bathroom within reach: this room counts for nothing.', 'Pas de salle de bain à portée : cette chambre ne compte pas.'],
  'venue.stock': ['Shelf', 'Rayon'],
  'venue.stockGood': ['Good on sale', 'Marchandise en vente'],
  'venue.inStorage': ['in storage', 'en entrepôt'],
  'venue.stockFill': ['Fill the shelf', 'Remplir le rayonnage'],
  'venue.stockRemove': ['Remove from shelf', 'Retirer du rayonnage'],
  'venue.stockLevel': ['Stock', 'Stock'],
  'venue.stockNoGoods': ['The Storehouse holds no Goods.', 'L’entrepôt ne contient aucune marchandise.'],
  'venue.stockNone': ['Nothing on sale', 'Rien en vente'],
  'venue.rooms': ['Complete rooms', 'Chambres complètes'],
  'venue.roomsOccupied': ['Rooms occupied', 'Chambres occupées'],
  'venue.standing': ['Standing', 'Standing'],
  'venue.reputation': ['Reputation', 'Réputation'],
  'venue.cleanliness': ['Cleanliness', 'Propreté'],
  'venue.role.cashier': ['Cashier', 'Personnel de caisse'],
  'venue.role.stocker': ['Stocker', 'Personnel de réassort'],
  'venue.role.receptionist': ['Receptionist', 'Réceptionniste'],
  'venue.role.housekeeper': ['Housekeeper', 'Personnel de ménage'],
  'venue.roleEffect.cashier': ['Runs the checkouts: faster service', 'Tient les caisses : service plus rapide'],
  'venue.roleEffect.stocker': ['Refills the shelves from the Storehouse every 20 minutes', 'Remplit les rayons depuis l’entrepôt toutes les 20 minutes'],
  'venue.roleEffect.receptionist': ['Checks guests in: more stays', 'Accueille les clients : plus de séjours'],
  'venue.roleEffect.housekeeper': ['Cleans 10 rooms a day: a clean hotel keeps its reputation', 'Nettoie 10 chambres par jour : un hôtel propre garde sa réputation'],
  'venue.category.walls': ['Walls', 'Murs'],
  'venue.category.power': ['Power', 'Force'],
  'venue.category.plumbing': ['Plumbing', 'Tuyauterie'],
  'venue.category.machines': ['Machines', 'Machines'],
  'venue.category.games': ['Games', 'Jeux'],
  'venue.category.service': ['Service', 'Services'],
  'venue.category.furniture': ['Furniture', 'Mobilier'],
  'venue.category.shelves': ['Shelves', 'Rayons'],
  'venue.category.checkouts': ['Checkouts', 'Caisses'],
  'venue.category.decor': ['Decor', 'Décoration'],
  'venue.category.beds': ['Beds', 'Lits'],
  'venue.category.bathroom': ['Bathroom', 'Salle de bain'],
  'venue.category.comfort': ['Comfort', 'Confort'],
  'venue.category.reception': ['Reception', 'Réception'],
  'error.unknownFixture': ['This Fixture does not exist.', 'Cet équipement n’existe pas.'],
  'error.nothingToRepair': ['This Fixture is in perfect condition.', 'Cet équipement est en parfait état.'],
  'venue.repair': ['Repair', 'Réparer'],
  'venue.condition': ['Condition', 'État'],
  'venue.wear': ['Wear', 'Vétusté'],
  'venue.broken': ['Out of order: it earns nothing until repaired.', 'En panne : il ne rapporte rien tant qu’il n’est pas réparé.'],
  'venue.worn': ['Worn: it may break down soon.', 'Usé : il risque de tomber en panne.'],
  'error.managerRequired': ['Hire a manager first.', 'Embauchez d’abord un manager.'],
  'error.rankTooLow': ['This Venue has not earned a high enough Rank yet.', 'Cet établissement n’a pas encore un rang assez élevé.'],
  'venue.rank': ['Rank', 'Rang'],
  'venue.rankNeeded': ['Rank', 'Rang'],
  'venue.eventNeedsRank': ['Events open at Rank 2: keep trading to earn it.', 'Les événements s’ouvrent au rang 2 : continuez d’exploiter pour l’atteindre.'],
  'venue.hireFee': ['Hiring fee', 'Frais d’embauche'],
  'error.noStaffPost': ['All the posts of this role are filled.', 'Tous les postes de ce rôle sont pourvus.'],
  'error.noStaffToRelease': ['Nobody to release in this role.', 'Personne à licencier dans ce rôle.'],
  'codex.fact.grid': ['Interior', 'Intérieur'],
  'codex.fact.posts': ['Staff posts', 'Postes de personnel'],
  'codex.fact.takingsCap': ['Takings cap', 'Plafond des recettes'],
  'codex.fact.floorGrid': ['Factory floor', 'Atelier'],
  'codex.fact.floorSpeedCap': ['Floor speed bonus, up to', 'Bonus de vitesse de l’atelier, jusqu’à'],
  'codex.fact.floorYieldCap': ['Floor yield bonus, up to', 'Bonus de rendement de l’atelier, jusqu’à'],
  'codex.fact.technicianPosts': ['Technician posts', 'Postes de technicien'],
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
  'venue.role.employee': ['Employee', 'Personnel de comptoir'],
  'venue.role.technician': ['Technician', 'Personnel technique'],
  'venue.role.security': ['Security', 'Sécurité'],
  'venue.roleEffect.manager': ['Unlocks pricing and events, +10% yield', 'Débloque les prix et les événements, +10 % de rendement'],
  'venue.roleEffect.employee': ['Serves the counter: faster service', 'Tient le comptoir : service plus rapide'],
  'venue.roleEffect.technician': ['Repairs the machines for less, slows the wear', 'Répare les machines à moindre coût, ralentit l’usure'],
  'venue.roleEffect.security': ['Prevents incidents: keeps 10% more Visitors', 'Évite les incidents : garde 10 % de visiteurs en plus'],
  'error.invalidPrice': ['This price is not allowed.', 'Ce prix n’est pas autorisé.'],
  'error.invalidArtist': ['This Artist is not on offer.', 'Cet artiste n’est pas proposé.'],
  'error.unknownPlayer': ['This player is not available.', 'Ce joueur n’est pas disponible.'],
  'error.notEnoughBudget': ['The Club budget is too low.', 'Le budget du club est trop bas.'],
  'error.squadFull': ['The Squad is full.', 'L’effectif est complet.'],
  'error.squadTooSmall': ['The Squad cannot get any smaller.', 'L’effectif ne peut pas être réduit davantage.'],
  'error.invalidLineup': ['This lineup is not valid.', 'Cette composition n’est pas valide.'],
  'error.noFixture': ['There is no Match left this year.', 'Il ne reste aucun match cette année.'],
  'error.matchNotStarted': ['The Match has not started yet.', 'Le match n’a pas encore commencé.'],
  'error.noClub': ['This stadium has no Club yet.', 'Ce stade n’a pas encore de club.'],
  'error.clubExists': ['This stadium already has a Club.', 'Ce stade a déjà un club.'],
  'venue.attractiveness': ['Attractiveness', 'Attractivité'],
  'venue.serviceRate': ['Service speed', 'Rapidité du service'],
  'venue.hint.counterFar': ['Too far from the entrance: the service slows down.', 'Trop loin de l’entrée : le service ralentit.'],
  'venue.hint.noise': ['Next to another loud machine: fewer Visitors come.', 'Collé à une autre borne bruyante : moins de visiteurs.'],
  'venue.hint.noHost': ['Needs a table next to it (or a counter for a stool).', 'Il lui faut une table à côté (ou un comptoir pour un tabouret).'],
  'venue.fixtureEarnings': ['Earns per hour', 'Rapporte par heure'],
  'venue.menu.back': ['City', 'Ville'],
  'venue.fixture.panel': ['Fixture', 'Équipement'],
  'venue.cancel': ['Cancel', 'Annuler'],
  'venue.manage': ['Manage', 'Gérer'],
  'home.interior.open': ['Furnish', 'Aménager'],
  'home.interior.comfort': ['Comfort', 'Confort'],
  'home.interior.wellbeing': ['Well-being', 'Bien-être'],
  'home.interior.wellbeingShort': ['Well-being', 'bien-être'],
  'factory.floor.open': ['Open the Factory floor', "Ouvrir l'atelier de l'usine"],
  'factory.floor.linked': ['Machines linked', 'Machines reliées'],
  'factory.floor.speed': ['Speed', 'Vitesse'],
  'factory.floor.yield': ['Yield', 'Rendement'],
  'factory.floor.problem.tankFull': ['Its Tank already feeds three Cooling vats: add a Tank, or take a vat off this one.', 'Son réservoir alimente déjà trois cuves réfrigérantes : ajoutez un réservoir, ou retirez une cuve de celui-ci.'],
  'factory.floor.problem.overloaded': ['Its Motor drives too many Machines and Pumps, so it is stopped: add a Motor or take one off.', 'Son moteur entraîne trop de machines et de pompes, elle est donc arrêtée : ajoutez un moteur ou retirez-en une.'],
  'factory.floor.motorOverloaded': ['{count} stopped: the Motor cannot drive them.', '{count} à l’arrêt : le moteur ne peut pas les entraîner.'],
  'factory.floor.benefit.own': ['Brings to the Factory: {bonus}.', 'Apporte à l’usine : {bonus}.'],
  'factory.floor.benefit.cooled': ['Cooled: its Motor stands beside a Cooling vat, which adds {share} to its bonus.', 'Refroidie : son moteur est à côté d’une cuve réfrigérante, qui ajoute {share} à son bonus.'],
  'factory.floor.benefit.vat': ['Cools {motors} Motor(s) beside it: {share} more speed and yield on the {machines} Machine(s) they drive.', 'Refroidit {motors} moteur(s) voisin(s) : {share} de vitesse et de rendement en plus sur les {machines} machine(s) qu’ils entraînent.'],
  'factory.floor.benefit.vatIdle': ['No Motor beside it: put it next to a Motor to cool the Machines it drives.', 'Aucun moteur à côté : placez-la contre un moteur pour refroidir les machines qu’il entraîne.'],
  'factory.floor.benefit.doubled': ['Doubled by the Boiler on its circuit of Flow.', 'Doublée par la chaudière de son circuit de fluide.'],
  'factory.floor.benefit.boiler': ['Doubles the cooling of {count} Cooling vat(s) on its circuit of Flow.', 'Double le refroidissement de {count} cuve(s) réfrigérante(s) de son circuit de fluide.'],
  'factory.floor.benefit.boilerPower': ['Its steam saves {share} of the Motors’ electricity.', 'Sa vapeur économise {share} de l’électricité des moteurs.'],
  'factory.floor.benefit.boilerIdle': ['Put a Cooling vat on its circuit of Flow to double its cooling.', 'Placez une cuve réfrigérante sur son circuit de fluide pour doubler son refroidissement.'],
  'factory.floor.benefit.motorCooled': ['Cooled by the Cooling vat beside it: {share} more speed and yield on the {machines} Machine(s) it drives.', 'Refroidi par la cuve réfrigérante voisine : {share} de vitesse et de rendement en plus sur les {machines} machine(s) qu’il entraîne.'],
  'factory.floor.benefit.motorIdle': ['A Cooling vat beside it would add to the speed and the yield of the Machines it drives.', 'Une cuve réfrigérante à côté ajouterait de la vitesse et du rendement aux machines qu’il entraîne.'],
  'factory.floor.benefit.variety': ['The kinds of Machine that run add {share} yield to the Factory.', 'La variété des machines qui tournent ajoute {share} de rendement à l’usine.'],
  'factory.floor.motorLoad': ['Machines driven: {driven} / {capacity}', 'Machines entraînées : {driven} / {capacity}'],
  'factory.floor.power': ['Power drawn by the Motors', 'Électricité des moteurs'],
  'factory.floor.hint': ['Link each Machine to a Motor through Shafts and Gears, or to a Tank through Pipes and a Pump that a Motor drives. Linked Machines speed the Factory up and raise its yield.', 'Reliez chaque machine à un moteur par des arbres et des engrenages, ou à un réservoir par des tuyaux et une pompe entraînée par un moteur. Les machines reliées accélèrent l’usine et augmentent son rendement.'],
  'factory.floor.linkedMachine': ['Linked: it adds its bonus.', 'Reliée : elle apporte son bonus.'],
  'factory.floor.problem.noDrive': ['No Drive reaches it: feed it from a Motor through Shafts and Gears, the input facing the line.', 'Aucune force ne l’atteint : alimentez-la depuis un moteur par des arbres et des engrenages, son entrée face à la ligne.'],
  'factory.floor.problem.wrongTurn': ['Its Drive turns the wrong way: add or remove a Gear meshed on the rim.', 'Sa force tourne dans le mauvais sens : ajoutez ou retirez un engrenage engrené par la jante.'],
  'factory.floor.problem.jammed': ['Its Gears are jammed: they are fed in two opposite directions.', 'Ses engrenages sont bloqués : ils sont alimentés dans deux sens opposés.'],
  'factory.floor.problem.noFlow': ['No Flow reaches it: a Tank gives Flow only through a Pump that is handed Drive, then Pipes joined end to end, its inlet facing the line.', 'Aucun fluide ne l’atteint : un réservoir n’en donne que par une pompe alimentée en force, puis des tuyaux bout à bout, son entrée face à la ligne.'],
  'factory.floor.optional': ['The Factory works without a floor; the Machines only add a bonus, capped by its Tier.', "L'usine fonctionne sans atelier ; les machines ajoutent seulement un bonus, plafonné par son niveau."],
  'venue.back': ['Back to the city', 'Retour à la ville'],
  'venue.build': ['Build', 'Construire'],
  'venue.takings': ['Takings', 'Recettes'],
  'venue.collect': ['Collect', 'Encaisser'],
  'venue.earnings': ['Earnings per hour', 'Gains par heure'],
  'venue.empty.arcade': ['No game yet: nobody comes to play.', 'Aucun jeu : personne ne vient jouer.'],
  'venue.empty.supermarket': ['No checkout or nothing on the shelves: nobody buys.', 'Pas de caisse ou rien en rayon : personne n’achète.'],
  'venue.empty.hotel': ['No complete room: no guest can stay.', 'Aucune chambre complète : aucun client ne peut séjourner.'],
  'venue.empty.restaurant': ['No cooktop, table, chair or checkout: nobody can be served.', 'Pas de plaque, de table, de chaise ou de caisse : personne ne peut être servi.'],
  'venue.chooseFixture': ['Choose a Fixture to place, or tap one to edit it.', 'Choisissez un équipement à poser, ou touchez-en un pour le modifier.'],
  'venue.placeHint': ['Tap a free cell to place it (Shift to place several).', 'Touchez une case libre pour le poser (Maj pour en poser plusieurs).'],
  'venue.moveHint': ['Tap a free cell to move it there.', 'Touchez une case libre pour le déplacer.'],
  'venue.cap': ['Takings are full: collect them.', 'La caisse est pleine : encaissez.'],
  'venue.tierNeeded': ['Tier', 'Niveau'],
  'venue.rotate': ['Rotate', 'Pivoter'],
  'venue.move': ['Move', 'Déplacer'],
  'venue.remove': ['Remove', 'Retirer'],
  'venue.entrance': ['Entrance', 'Entrée'],
};

export function venueMessages(language: 'en' | 'fr'): Record<VenueMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const fixtureNames = FIXTURE_ENTRIES.map(({ id, name }) => [`venue.fixture.${id}`, name[language]]);
  return Object.fromEntries([...Object.entries(texts).map(([key, pair]) => [key, pair[index]]), ...fixtureNames]) as Record<VenueMessageKey, string>;
}
