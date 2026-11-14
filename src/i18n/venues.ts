import type { FixtureId, InteriorRole, StaffRole, VenueType } from '../core/engine/state';
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
  | 'venue.repairAll'
  | 'venue.repairDetail'
  | 'venue.condition'
  | 'venue.wear'
  | 'venue.broken'
  | 'venue.worn'
  | 'error.noStaffPost'
  | 'error.exitLimitReached'
  | 'error.noStaffToRelease'
  | 'error.wrongPackSize'
  | 'error.notAnExit'
  | 'error.noRestock'
  | 'error.restockerAlreadyAssigned'
  | 'error.noFreeRestocker'
  | 'error.notAssignable'
  | 'error.notUpstream'
  | 'venue.assignNoSupply'
  | 'error.fixtureLimitReached'
  | 'error.noFocus'
  | 'error.staffAlreadyAssigned'
  | 'error.noFreeStaff'
  | 'error.noStaffAssigned'
  | 'error.noRestockerAssigned'
  | 'codex.fact.grid'
  | 'codex.fact.posts'
  | 'codex.fact.takingsCap'
  | 'codex.fact.fixtures'
  | 'codex.fact.interiorGrid'
  | 'codex.fact.interiorSpeedCap'
  | 'codex.fact.interiorYieldCap'
  | 'codex.fact.interiorSalesCap'
  | 'codex.fact.interiorQualityCap'
  | 'codex.fact.interiorCapacityCap'
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
  | 'venue.recipes'
  | 'venue.management'
  | 'interior.features'
  | 'interior.examples.show'
  | 'interior.examples.title'
  | 'interior.examples.tier'
  | 'interior.examples.legend'
  | 'interior.examples.factory'
  | 'interior.examples.mill'
  | 'interior.examples.workshop'
  | 'interior.examples.bakery'
  | 'interior.examples.dairy'
  | 'interior.examples.packhouse'
  | 'interior.examples.storehouse'
  | `interior.features.${'factory' | 'packhouse' | 'mill' | 'workshop' | 'bakery' | 'dairy' | 'storehouse' | 'school' | 'library' | 'hospital'}`
  | 'bakery.recipes.assembly'
  | 'bakery.recipes.limits'
  | 'bakery.recipes.bonuses'
  | 'bakery.recipes.mixer'
  | 'bakery.recipes.oven'
  | 'bakery.recipes.counter'
  | 'bakery.recipes.caps'
  | 'bakery.recipes.now'
  | 'bakery.recipes.consumption'
  | 'bakery.recipes.power'
  | 'bakery.recipes.wages'
  | 'venue.wage'
  | 'venue.wages'
  | 'venue.net'
  | 'venue.closed'
  | 'venue.hire'
  | 'venue.release'
  | 'venue.priceLocked'
  | `venue.role.${StaffRole}`
  | `venue.roleEffect.${StaffRole}`
  | `interior.role.${InteriorRole}`
  | `interior.roleEffect.${InteriorRole}`
  | 'venue.role.restocker'
  | 'venue.roleEffect.restocker'
  | 'venue.restock'
  | 'venue.restockNone'
  | 'venue.restockAssign'
  | 'venue.restockRelease'
  | 'venue.restockAtWork'
  | 'venue.assignRecipe'
  | 'venue.assignSoldGood'
  | 'venue.assignNone'
  | 'venue.pickItem'
  | 'venue.binItem'
  | 'venue.binNoItem'
  | 'venue.assignStaff'
  | 'venue.assignRelease'
  | 'venue.assignAtWork'
  | 'venue.restockerFree'
  | 'venue.attractiveness'
  | 'venue.serviceRate'
  | 'venue.hint.counterFar'
  | 'venue.hint.noise'
  | 'venue.hint.noHost'
  | 'venue.fixtureEarnings'
  | 'venue.manage'
  | 'home.interior.open'
  | 'home.interior.parquet'
  | `home.interior.parquet.${string}`
  | 'blocked.furnish'
  | 'blocked.interior'
  | 'service.interior.quality'
  | 'home.interior.comfort'
  | 'home.interior.wellbeing'
  | 'home.interior.wellbeingShort'
  | `interior.open.${'factory' | 'packhouse' | 'mill' | 'workshop' | 'bakery' | 'dairy' | 'storehouse' | 'school' | 'library' | 'hospital'}`
  | 'factory.interior.linked'
  | 'factory.interior.speed'
  | 'factory.interior.yield'
  | 'factory.interior.power'
  | 'factory.interior.motorLoad'
  | 'factory.interior.benefit.own'
  | 'factory.interior.benefit.cooled'
  | 'factory.interior.benefit.vat'
  | 'factory.interior.benefit.vatIdle'
  | 'factory.interior.benefit.doubled'
  | 'factory.interior.benefit.boiler'
  | 'factory.interior.benefit.boilerIdle'
  | 'factory.interior.benefit.boilerPower'
  | 'factory.interior.benefit.motorCooled'
  | 'factory.interior.benefit.motorIdle'
  | 'factory.interior.benefit.variety'
  | 'factory.interior.hint'
  | 'factory.interior.optional'
  | 'factory.interior.linkedMachine'
  | 'packhouse.interior.lined'
  | 'packhouse.interior.idle'
  | 'packhouse.interior.fault.broken'
  | 'packhouse.interior.fault.noDrive'
  | 'packhouse.interior.fault.noFlow'
  | 'packhouse.interior.fault.misfacing'
  | 'packhouse.interior.fault.deadEnd'
  | 'packhouse.interior.fault.overfed'
  | 'packhouse.interior.noExit'
  | 'mill.interior.incomplete'
  | 'packhouse.interior.exitSize'
  | 'packhouse.interior.size.Crate'
  | 'packhouse.interior.size.Box'
  | 'packhouse.interior.size.Pallet'
  | 'factory.interior.problem.noDrive'
  | 'factory.interior.problem.wrongTurn'
  | 'factory.interior.problem.jammed'
  | 'factory.interior.problem.noFlow'
  | 'factory.interior.problem.overloaded'
  | 'factory.interior.problem.tankFull'
  | 'factory.interior.motorOverloaded'
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
  'venue.category.line': ['Line', 'Ligne'],
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
  'venue.repairAll': ['Repair everything', 'Tout réparer'],
  'venue.repairDetail': ['Detail', 'Détail'],
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
  'error.exitLimitReached': ['This interior has all the Exits of this size its Tier allows.', 'Cet intérieur a toutes les sorties de ce format que son niveau permet.'],
  'error.wrongPackSize': ['This Good is not packed in the size of this Exit.', 'Ce produit n’est pas emballé au format de cette sortie.'],
  'error.notAnExit': ['This Fixture is not an Exit.', 'Cet équipement n’est pas une sortie.'],
  'error.noRestock': ['Choose a Restock for this Exit first.', 'Choisissez d’abord un réassort pour cette sortie.'],
  'error.restockerAlreadyAssigned': ['A Restocker is already assigned here.', 'Un employé de réassort est déjà affecté ici.'],
  'error.noFreeRestocker': ['No Restocker is free: hire one or release another Exit.', 'Aucun employé de réassort n’est libre : embauchez-en un ou libérez une autre sortie.'],
  'error.fixtureLimitReached': ['The Bakery has no Slot left for another one: buy a Slot to fit more.', 'La boulangerie n’a plus d’emplacement pour un autre : achetez un emplacement pour en ajouter.'],
  'error.notUpstream': ['No Oven upstream of this counter bakes that Good.', 'Aucun four en amont de ce comptoir ne cuit ce bien.'],
  'venue.assignNoSupply': ['No Oven upstream bakes a Recipe yet: choose one on an Oven that feeds this counter.', 'Aucun four en amont ne cuit encore de recette : choisissez-en une sur un four qui alimente ce comptoir.'],
  'error.notAssignable': ['This Fixture takes no Staff.', 'Ce meuble ne prend pas de personnel.'],
  'error.noFocus': ['Choose a Recipe or a Sold Good first.', 'Choisissez d’abord une recette ou un bien vendu.'],
  'error.staffAlreadyAssigned': ['A Staff is already assigned here.', 'Un membre du personnel est déjà affecté ici.'],
  'error.noFreeStaff': ['No Staff is free: hire one or free another Fixture.', 'Aucun membre du personnel n’est libre : embauchez-en un ou libérez un autre meuble.'],
  'error.noStaffAssigned': ['No Staff is assigned here.', 'Aucun membre du personnel n’est affecté ici.'],
  'error.noRestockerAssigned': ['No Restocker is assigned to this Exit.', 'Aucun employé de réassort n’est affecté à cette sortie.'],
  'error.noStaffToRelease': ['Nobody to release in this role.', 'Personne à licencier dans ce rôle.'],
  'codex.fact.grid': ['Interior', 'Intérieur'],
  'codex.fact.posts': ['Staff posts', 'Postes de personnel'],
  'codex.fact.takingsCap': ['Takings cap', 'Plafond des recettes'],
  'codex.fact.interiorGrid': ['Factory interior', 'Atelier'],
  'codex.fact.interiorSpeedCap': ['Interior speed bonus, up to', 'Bonus de vitesse de l’intérieur, jusqu’à'],
  'codex.fact.interiorYieldCap': ['Interior yield bonus, up to', 'Bonus de rendement de l’intérieur, jusqu’à'],
  'codex.fact.interiorQualityCap': ['Interior quality bonus, up to', 'Bonus de qualité de l’intérieur, jusqu’à'],
  'codex.fact.interiorSalesCap': ['Interior sales bonus, up to', 'Bonus de vente de l’intérieur, jusqu’à'],
  'codex.fact.interiorCapacityCap': ['Interior room bonus, up to', 'Bonus de place de l’intérieur, jusqu’à'],
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
  'venue.recipes': ["Recipes", "Recettes"],
  'venue.management': ['Management', 'Gestion'],
  'interior.features': ['What it does', 'Fonctionnalités'],
  'interior.examples.show': ["Examples of set-ups", "Exemples de montages"],
  'interior.examples.title': ["Example set-up", "Exemple de montage"],
  'interior.examples.tier': ["Room of a Tier {tier} building", "Salle d’un bâtiment de niveau {tier}"],
  'interior.examples.legend': ["Pieces", "Pièces"],
  'interior.examples.factory': ["A Tank feeds a Pump that a Motor drives, and the Flow goes through a Pipe tee to a Mixing vat. A second Motor drives a Press through a Shaft. The Mixing vat stands beside that Motor and cools it, which raises the speed and the yield of the Press.", "Un réservoir alimente une pompe entraînée par un moteur, et le fluide passe par un té de tuyau jusqu’à la cuve de mélange. Un second moteur entraîne une presse par un arbre. La cuve de mélange est à côté de ce moteur et le refroidit, ce qui augmente la vitesse et le rendement de la presse."],
  'interior.examples.mill': ["A first Motor turns a Shaft that drives the Millstone. A second Motor drives the Pump, which pushes through the Pipes to the Cleaner where the grain comes in, the Millstone, then the Bagger that bags the flour or the Oil tank that stores the olive oil.", "Un premier moteur fait tourner un arbre qui entraîne la meule. Un second moteur entraîne la pompe, qui pousse dans les tuyaux jusqu’au nettoyeur où entre le grain, la meule, puis l’ensacheuse qui met la farine en sacs ou la cuve à huile qui stocke l’huile d’olive."],
  'interior.examples.workshop': ["A Tank, a Pump and a Motor send the air through Pipes to the Extractor against the back wall and to the Cleaner. Conveyors carry the material from the Extractor to the Cleaner, then to the Storage bin, where a restocker keeps the queue running.", "Un réservoir, une pompe et un moteur envoient l’air par des tuyaux à l’extracteur contre le mur du fond et au nettoyeur. Des tapis portent le matériau de l’extracteur au nettoyeur, puis au bac de stockage, où un employé de réassort fait tourner la file."],
  'interior.examples.bakery': ["A Motor and a Shaft drive the Mixer against the back wall. A Tank, a Pump and a Motor bring the gas to the Oven. Conveyors carry the dough from the Mixer to the Oven, then the bread to the Counter, where it is sold.", "Un moteur et un arbre entraînent le pétrin contre le mur du fond. Un réservoir, une pompe et un moteur amènent le gaz au four. Des tapis portent la pâte du pétrin au four, puis le pain jusqu’au comptoir, où il est vendu."],
  'interior.examples.dairy': ["The Milk vat takes in the milk, and every Machine has its own Tank, Pump and Motor. Conveyors carry the milk to the Pasteuriser, then to the Cheese cellar, then to the Counter, where the cream and the cheese are sold.", "La cuve à lait reçoit le lait, et chaque machine a son réservoir, sa pompe et son moteur. Des tapis portent le lait au pasteurisateur, puis à la cave d’affinage, puis au comptoir, où la crème et le fromage sont vendus."],
  'interior.examples.packhouse': ["A Motor and a Shaft drive the Packer against the back wall. Conveyors carry the Packets down to the Exit, where a truck takes the crates away.", "Un moteur et un arbre entraînent l’emballeuse contre le mur du fond. Des tapis portent les paquets jusqu’à la sortie, où un camion emporte les caisses."],
  'interior.examples.storehouse': ["A Motor drives the Loading dock where the Goods come in, and another one drives the Hoist. Conveyors carry the crates to the Rack, which stores them: every linked Rack adds room to the Storehouse.", "Un moteur entraîne le quai de chargement où entrent les biens, et un autre entraîne le palan. Des tapis portent les caisses jusqu’au rayonnage, qui les stocke : chaque rayonnage relié ajoute de la place à l’entrepôt."],
  'interior.features.factory': ["Machines turn the Motor's Drive into speed and yield for the Factory's Slots. Link them with Shafts and Gears, add Flow for the Machines that need it, and cool the Motors with a Cooling vat. Each Machine can make any Good of the Factory: pick one, and a Restocker assigned to it stores what it makes in the Storehouse.", "Les machines transforment la force du moteur en vitesse et en rendement pour les emplacements de l'usine. Reliez-les par des arbres et des engrenages, ajoutez du fluide pour celles qui en ont besoin, et refroidissez les moteurs avec une cuve réfrigérante. Chaque machine peut fabriquer n'importe quel bien de l'usine : choisissez-en un, et un employé de réassort affecté le range à l'entrepôt."],
  'interior.features.packhouse': ['A Line carries Packets from a Packer against the back wall, through the Conveyors, Strappers and Scanners, to the Exits. Linked Machines raise the speed of the Slots that pack a size of Goods, and the Exits set the yield. Keep every Machine linked and fed, and restock the Exits.', "Une chaîne porte les colis d'une emballeuse contre le mur du fond, par les tapis, les cercleuses et les scanners, jusqu'aux sorties. Les machines reliées accélèrent les emplacements qui emballent une taille de biens, et les sorties fixent le rendement. Gardez chaque machine reliée et alimentée, et réapprovisionnez les sorties."],
  'interior.features.mill': ['A Motor, Shafts and Gears drive the millstones, and a Pump drives the Pipes. Choose on each millstone what it grinds, wheat or olives: a Cleaner takes the grain in, a Bagger gives the flour out and an Oil tank the olive oil, all on the Pipes of the same Pump. Linked millstones add speed to the Mill, up to a cap that rises with the Tier, and millers deliver it. A miller assigned to a complete millstone grinds on his own and stores the production in the Storehouse; without one, you collect it yourself.', "Un moteur, des arbres et des engrenages font tourner les meules, et une pompe alimente la tuyauterie. Choisissez sur chaque meule ce qu'elle moud, du blé ou des olives : une nettoyeuse prend le grain en entrée, une ensacheuse rend la farine et un réservoir d'huile l'huile d'olive, tous sur les tuyaux de la même pompe. Les meules reliées ajoutent de la vitesse à la minoterie, jusqu'à un plafond qui monte avec le niveau, et les meuniers la délivrent. Un meunier affecté à une meule complète moud seul et range la production à l'entrepôt ; sans lui, vous la collectez vous-même."],
  'interior.features.workshop': ["Pneumatic air feeds the machines: a Tank, a Pump and a Motor send it through Pipes to the Extractor, set against a wall, and to the Cleaner. A Line carries what the Extractor takes in, the material you picked on it, through the Cleaner to a Storage bin. A restocker assigned to the bin restarts the production of that material by himself and stores it in the Storehouse, so the queue of the Workshop runs on its own. Nothing is faster or richer: the gain is the queue.", "L'air pneumatique alimente les machines : un réservoir, une pompe et un moteur l'envoient par des tuyaux à l'extracteur, contre un mur, et au nettoyeur. Une chaîne porte ce que l'extracteur prélève, le matériau choisi dessus, à travers le nettoyeur jusqu'à un bac de stockage. Un employé de réassort affecté au bac relance seul la production de ce matériau et la range à l'entrepôt : la file de l'atelier tourne toute seule. Rien n'est plus rapide ni plus riche : le gain, c'est la file."],
  'interior.features.bakery': ['A Line carries the dough from the Mixer through an Oven to a Display counter. Mixers and Ovens add speed, Display counters add sales and yield, each up to a cap that rises with the Tier, and bakers and sellers deliver them. Assign a baker to an Oven with a Recipe and a seller to a Display counter: they bake, store and sell on their own. The Recipes and the bonuses are detailed below.', "Une chaîne porte la pâte du pétrin à un comptoir vitrine en passant par un four. Pétrins et fours ajoutent de la vitesse, les comptoirs vitrine des ventes et du rendement, chacun jusqu'à un plafond qui monte avec le niveau, et les boulangers et les vendeurs les délivrent. Affectez un boulanger à un four avec une recette et un vendeur à un comptoir vitrine : ils cuisent, rangent et vendent seuls. Les recettes et les bonus sont détaillés ci-dessous."],
  'interior.features.dairy': ["A Line carries the milk from the vat through the Machines to an Exit. Cheesemakers and cream makers add the cheese and cream yield, and assigned to a Cheese cellar or a Pasteuriser with a Recipe they make it on their own and store it; a seller assigned to a Display counter sells what arrives on it.", "Une chaîne porte le lait de la cuve jusqu'à une sortie à travers les machines. Les fromagers et les crémiers ajoutent le rendement en fromage et en crème, et affectés à une cave d’affinage ou à un pasteurisateur avec une recette ils la fabriquent seuls et la rangent ; un vendeur affecté à un comptoir vitrine vend ce qui y arrive."],
  'interior.features.storehouse': ["A Line runs from a loading dock, by a hoist, to a shelf rack: each linked rack adds room to the Storehouse. A stocker adds the room bonus.", "Une chaîne court d'un quai de chargement, par un palan, jusqu'à un rayonnage : chaque rayonnage relié ajoute de la place à l'entrepôt. Un magasinier ajoute le bonus de place."],
  'interior.features.school': ["Furniture adds quality, up to a cap that rises with the Tier. A teacher adds the schooling the School gives to the homes it serves. Furniture never wears.", "Le mobilier ajoute de la qualité, jusqu'à un plafond qui monte avec le niveau. Un enseignant ajoute la scolarité que l'école donne aux logements desservis. Le mobilier ne s'use jamais."],
  'interior.features.library': ["Furniture adds quality, up to a cap that rises with the Tier. A librarian adds the Knowledge the Library gives to the homes it serves. Furniture never wears.", "Le mobilier ajoute de la qualité, jusqu'à un plafond qui monte avec le niveau. Un bibliothécaire ajoute le savoir que la bibliothèque donne aux logements desservis. Le mobilier ne s'use jamais."],
  'interior.features.hospital': ["Furniture adds quality, up to a cap that rises with the Tier. Nurses, doctors and surgeons each bring a part of the care, which adds Well-being to the homes served. Furniture never wears.", "Le mobilier ajoute de la qualité, jusqu'à un plafond qui monte avec le niveau. Infirmiers, médecins et chirurgiens apportent chacun une part des soins, qui ajoute du bien-être aux logements desservis. Le mobilier ne s'use jamais."],
  'bakery.recipes.assembly': ["Assembly", "Montage"],
  'bakery.recipes.limits': ["One Mixer feeds up to {mixer} Ovens, and one Oven up to {oven} Display counters; past that, a Fixture gets no Packets.", "Un pétrin alimente au plus {mixer} fours, et un four au plus {oven} comptoirs vitrine ; au-delà, une pièce ne reçoit rien."],
  'bakery.recipes.bonuses': ["Bonuses", "Bonus"],
  'bakery.recipes.mixer': ["Dough mixer: speed {value}", "Pétrin : vitesse {value}"],
  'bakery.recipes.oven': ["Tunnel oven: speed {value}", "Four tunnel : vitesse {value}"],
  'bakery.recipes.counter': ["Display counter: sales {value}, yield {yield}, draws {power} of power", "Comptoir vitrine : ventes {value}, rendement {yield}, consomme {power} d’électricité"],
  'bakery.recipes.caps': ["Caps at this Tier: speed {speed}, yield {yield}, sales {sales}.", "Plafonds à ce Tier : vitesse {speed}, rendement {yield}, ventes {sales}."],
  'bakery.recipes.now': ["Now: speed {speed}, yield {yield}, sales {sales}.", "Actuellement : vitesse {speed}, rendement {yield}, ventes {sales}."],
  'bakery.recipes.consumption': ["Consumption", "Consommations"],
  'bakery.recipes.power': ["Power drawn by the Motors and the Counters: {value}", "Électricité des moteurs et des comptoirs : {value}"],
  'bakery.recipes.wages': ["Staff wages now:", "Salaires actuels :"],
  'venue.wage': ['per day', 'par jour'],
  'venue.wages': ['Wages per hour', 'Salaires par heure'],
  'venue.net': ['Net per hour', 'Net par heure'],
  'venue.closed': ['Closed: the wages cannot be paid.', 'Fermé : les salaires ne peuvent pas être payés.'],
  'venue.hire': ['Hire', 'Embaucher'],
  'venue.release': ['Release', 'Licencier'],
  'venue.priceLocked': ['Only a manager can change the price.', 'Seul un manager peut changer le prix.'],
  'venue.role.manager': ['Manager', 'Manager'],
  'venue.role.employee': ['Employee', 'Personnel de comptoir'],
  'interior.role.miller': ['Miller', 'Meunier'],
  'interior.roleEffect.miller': ['Turns the grain into flour faster: the speed bonus of the millstones', "Moud plus vite : le bonus de vitesse des meules"],
  'interior.role.restocker': ['Restocker', 'Réassort'],
  'interior.roleEffect.restocker': ['Restarts the production of the material of his bin and stores it, with no bonus to speed or yield', "Relance la production du matériau de son bac et la range, sans bonus de vitesse ni de rendement"],
  'interior.role.baker': ['Baker', 'Boulanger'],
  'interior.roleEffect.baker': ['Bakes faster: the speed bonus of the machines', "Cuit plus vite : le bonus de vitesse des machines"],
  'interior.role.seller': ['Seller', 'Vendeur'],
  'interior.roleEffect.seller': ['Sells the loaves over the Counter faster', "Vend les pains au comptoir plus vite"],
  'interior.role.cheesemaker': ['Cheesemaker', 'Fromager'],
  'interior.roleEffect.cheesemaker': ['Makes more Cheese from the Milk', "Tire plus de fromage du lait"],
  'interior.role.creamMaker': ['Cream maker', 'Crémier'],
  'interior.roleEffect.creamMaker': ['Makes more Cream from the Milk', "Tire plus de crème du lait"],
  'interior.role.stocker': ['Stocker', 'Magasinier'],
  'interior.roleEffect.stocker': ['Puts the crates away: more room in the Storehouse', "Range les caisses : plus de place dans l’entrepôt"],
  'interior.role.teacher': ['Teacher', 'Enseignant'],
  'interior.roleEffect.teacher': ['Teaches better: more Knowledge from this School', "Enseigne mieux : plus de Savoir pour cette école"],
  'interior.role.librarian': ['Librarian', 'Bibliothécaire'],
  'interior.roleEffect.librarian': ['Spreads more Knowledge from this Library', "Diffuse plus de Savoir depuis cette bibliothèque"],
  'interior.role.nurse': ['Nurse', 'Infirmier'],
  'interior.roleEffect.nurse': ['Cares for the patients: Well-being of the covered Homes', "Soigne les patients : bien-être des logements couverts"],
  'interior.role.doctor': ['Doctor', 'Médecin'],
  'interior.roleEffect.doctor': ['Treats more serious cases: more Well-being', "Traite les cas graves : plus de bien-être"],
  'interior.role.surgeon': ['Surgeon', 'Chirurgien'],
  'interior.roleEffect.surgeon': ['Operates: the most Well-being a Hospital can give', "Opère : le plus de bien-être qu’un hôpital puisse donner"],
  'venue.role.technician': ['Technician', 'Personnel technique'],
  'venue.role.restocker': ['Restocker', 'Employé de réassort'],
  'venue.roleEffect.restocker': ['Keeps the production of a Restock going and stores it', 'Relance la production d’un réassort et la range à l’entrepôt'],
  'venue.restock': ['Restock', 'Réassort'],
  'venue.restockNone': ['No restock', 'Aucun réassort'],
  'venue.restockAssign': ['Assign a Restocker', 'Affecter un employé de réassort'],
  'venue.restockRelease': ['Free the Restocker', 'Libérer l’employé de réassort'],
  'venue.restockAtWork': ['A Restocker works here', 'Un employé de réassort travaille ici'],
  'venue.assignRecipe': ['Recipe', 'Recette'],
  'venue.assignSoldGood': ['Sold Good', 'Bien vendu'],
  'venue.assignNone': ['None', 'Aucun'],
  'venue.pickItem': ['Item extracted', 'Matériau extrait'],
  'venue.binItem': ['Restocks {item}, picked on the Extractor upstream.', 'Réassort de {item}, choisi sur l’extracteur en amont.'],
  'venue.binNoItem': ['No Extractor upstream has an item picked yet: choose one on an Extractor that feeds this bin.', 'Aucun extracteur en amont n’a encore de matériau : choisissez-en un sur un extracteur qui alimente ce bac.'],
  'venue.assignStaff': ['Assign a Staff ({role})', 'Affecter un employé ({role})'],
  'venue.assignRelease': ['Free the Staff ({role})', 'Libérer l’employé ({role})'],
  'venue.assignAtWork': ['A Staff ({role}) works here', 'Un employé ({role}) travaille ici'],
  'venue.restockerFree': ['Free Restockers', 'Employés de réassort libres'],
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
  'service.interior.quality': ['Quality', 'Qualité'],
  'blocked.interior': ['Its interior opens at {citizens} Citizens.', "Son intérieur s'ouvre à {citizens} habitants."],
  'blocked.furnish': ['Furnishing opens at {citizens} Citizens.', "L'aménagement s'ouvre à {citizens} habitants."],
  'home.interior.parquet': ['Floor', 'Parquet'],
  'home.interior.parquet.light': ['Light oak', 'Chêne clair'],
  'home.interior.parquet.honey': ['Honey', 'Miel'],
  'home.interior.parquet.walnut': ['Walnut', 'Noyer'],
  'home.interior.parquet.ebony': ['Ebony', 'Ébène'],
  'home.interior.open': ['Furnish', 'Aménager'],
  'home.interior.comfort': ['Comfort', 'Confort'],
  'home.interior.wellbeing': ['Well-being', 'Bien-être'],
  'home.interior.wellbeingShort': ['Well-being', 'bien-être'],
  'interior.open.factory': ['Open the Factory interior', "Ouvrir l'atelier de l'usine"],
  'interior.open.packhouse': ['Open the Packhouse interior', "Ouvrir l'atelier du conditionnement"],
  'interior.open.mill': ['Open the Mill interior', "Ouvrir l'atelier de la minoterie"],
  'interior.open.workshop': ['Open the Workshop interior', "Ouvrir l'intérieur de l'atelier"],
  'interior.open.bakery': ['Open the Bakery interior', "Ouvrir l'atelier de la boulangerie"],
  'interior.open.dairy': ['Open the Dairy interior', "Ouvrir l'atelier de la laiterie"],
  'interior.open.storehouse': ['Open the Storehouse interior', "Ouvrir l'intérieur de l'entrepôt"],
  'interior.open.school': ['Open the School interior', "Ouvrir l'intérieur de l'école"],
  'interior.open.library': ['Open the Library interior', "Ouvrir l'intérieur de la bibliothèque"],
  'interior.open.hospital': ['Open the Hospital interior', "Ouvrir l'intérieur de l'hôpital"],
  'factory.interior.linked': ['Machines linked', 'Machines reliées'],
  'factory.interior.speed': ['Speed', 'Vitesse'],
  'factory.interior.yield': ['Yield', 'Rendement'],
  'factory.interior.problem.tankFull': ['Its Tank already feeds three Cooling vats: add a Tank, or take a vat off this one.', 'Son réservoir alimente déjà trois cuves réfrigérantes : ajoutez un réservoir, ou retirez une cuve de celui-ci.'],
  'factory.interior.problem.overloaded': ['Its Motor drives too many Machines and Pumps, so it is stopped: add a Motor or take one off.', 'Son moteur entraîne trop de machines et de pompes, elle est donc arrêtée : ajoutez un moteur ou retirez-en une.'],
  'factory.interior.motorOverloaded': ['{count} stopped: the Motor cannot drive them.', '{count} à l’arrêt : le moteur ne peut pas les entraîner.'],
  'factory.interior.benefit.own': ['Brings to the Factory: {bonus}.', 'Apporte à l’usine : {bonus}.'],
  'factory.interior.benefit.cooled': ['Cooled: its Motor stands beside a Cooling vat, which adds {share} to its bonus.', 'Refroidie : son moteur est à côté d’une cuve réfrigérante, qui ajoute {share} à son bonus.'],
  'factory.interior.benefit.vat': ['Cools {motors} Motor(s) beside it: {share} more speed and yield on the {machines} Machine(s) they drive.', 'Refroidit {motors} moteur(s) voisin(s) : {share} de vitesse et de rendement en plus sur les {machines} machine(s) qu’ils entraînent.'],
  'factory.interior.benefit.vatIdle': ['No Motor beside it: put it next to a Motor to cool the Machines it drives.', 'Aucun moteur à côté : placez-la contre un moteur pour refroidir les machines qu’il entraîne.'],
  'factory.interior.benefit.doubled': ['Doubled by the Boiler on its circuit of Flow.', 'Doublée par la chaudière de son circuit de fluide.'],
  'factory.interior.benefit.boiler': ['Doubles the cooling of {count} Cooling vat(s) on its circuit of Flow.', 'Double le refroidissement de {count} cuve(s) réfrigérante(s) de son circuit de fluide.'],
  'factory.interior.benefit.boilerPower': ['Its steam saves {share} of the Motors’ electricity.', 'Sa vapeur économise {share} de l’électricité des moteurs.'],
  'factory.interior.benefit.boilerIdle': ['Put a Cooling vat on its circuit of Flow to double its cooling.', 'Placez une cuve réfrigérante sur son circuit de fluide pour doubler son refroidissement.'],
  'factory.interior.benefit.motorCooled': ['Cooled by the Cooling vat beside it: {share} more speed and yield on the {machines} Machine(s) it drives.', 'Refroidi par la cuve réfrigérante voisine : {share} de vitesse et de rendement en plus sur les {machines} machine(s) qu’il entraîne.'],
  'factory.interior.benefit.motorIdle': ['A Cooling vat beside it would add to the speed and the yield of the Machines it drives.', 'Une cuve réfrigérante à côté ajouterait de la vitesse et du rendement aux machines qu’il entraîne.'],
  'factory.interior.benefit.variety': ['The kinds of Machine that run add {share} yield to the Factory.', 'La variété des machines qui tournent ajoute {share} de rendement à l’usine.'],
  'factory.interior.motorLoad': ['Machines driven: {driven} / {capacity}', 'Machines entraînées : {driven} / {capacity}'],
  'factory.interior.power': ['Power drawn by the Motors', 'Électricité des moteurs'],
  'factory.interior.hint': ['Link each Machine to a Motor through Shafts and Gears, or to a Tank through Pipes and a Pump that a Motor drives. Linked Machines speed the Factory up and raise its yield.', 'Reliez chaque machine à un moteur par des arbres et des engrenages, ou à un réservoir par des tuyaux et une pompe entraînée par un moteur. Les machines reliées accélèrent l’usine et augmentent son rendement.'],
  'factory.interior.linkedMachine': ['Linked: it adds its bonus.', 'Reliée : elle apporte son bonus.'],
  'packhouse.interior.lined': ['On a Line that reaches an Exit.', 'Sur une ligne qui atteint une sortie.'],
  'packhouse.interior.idle': ['Carries no Packets: no Packer with Drive sends any here, or this does not lead to an Exit.', 'Ne porte aucun paquet : aucune emballeuse alimentée n’en envoie ici, ou cela ne mène pas à une sortie.'],
  'packhouse.interior.fault.broken': ['The Line is cut: {name} is broken (marked on the floor). Repair it.', 'La ligne est coupée : {name} est en panne (marqué au sol). Réparez-le.'],
  'packhouse.interior.fault.noDrive': ['{name} gets no Drive (marked on the floor): its input must face a Shaft or a Gear that a Motor turns.', '{name} ne reçoit aucune force (marqué au sol) : son entrée doit faire face à un arbre ou un engrenage que tourne un moteur.'],
  'packhouse.interior.fault.noFlow': ['{name} gets no Flow (marked on the floor): its input must face a Pipe or a Tank fed by a Pump that a Motor drives.', '{name} ne reçoit aucun fluide (marqué au sol) : son entrée doit faire face à un tuyau ou une cuve alimentés par une pompe qu’entraîne un moteur.'],
  'packhouse.interior.fault.misfacing': ['{name} next to it (marked on the floor) does not carry Packets toward it: turn it or replace it.', '{name} à côté (marqué au sol) ne porte pas les paquets vers lui : pivotez-le ou remplacez-le.'],
  'packhouse.interior.fault.deadEnd': ['Nothing brings Packets to {name}: the cell in front of its entry (marked on the floor) is empty, lay a Conveyor there that carries toward it.', 'Rien n’apporte de paquets à {name} : la case devant son entrée (marquée au sol) est vide, posez-y un tapis qui porte vers lui.'],
  'packhouse.interior.fault.overfed': ['The Machine ahead already feeds as many {name} as it can: this one gets no Packets. Remove it, or take another from the Line.', 'La machine en amont alimente déjà autant de {name} qu’elle le peut : celui-ci ne reçoit rien. Retirez-le, ou retirez-en un autre de la chaîne.'],
  'mill.interior.incomplete': ['The pipes of its Pump must reach a Cleaner and, for its Recipe, a Bagger (flour) or an Oil tank (olive oil), and a Recipe must be chosen.', "La tuyauterie de sa pompe doit atteindre une nettoyeuse et, selon sa recette, une ensacheuse (farine) ou un réservoir d'huile (huile d'olive), et une recette doit être choisie."],
  'packhouse.interior.noExit': ['Its Packets reach no Exit: it adds no bonus.', 'Ses paquets n’atteignent aucune sortie : elle n’apporte aucun bonus.'],
  'packhouse.interior.exitSize': ['Serves {size} of packed Goods.', 'Dessert les {size} de produits emballés.'],
  'packhouse.interior.size.Crate': ['crates', 'caisses'],
  'packhouse.interior.size.Box': ['boxes', 'cartons'],
  'packhouse.interior.size.Pallet': ['pallets', 'palettes'],
  'factory.interior.problem.noDrive': ['No Drive reaches it: feed it from a Motor through Shafts and Gears, the input facing the line.', 'Aucune force ne l’atteint : alimentez-la depuis un moteur par des arbres et des engrenages, son entrée face à la ligne.'],
  'factory.interior.problem.wrongTurn': ['Its Drive turns the wrong way: add or remove a Gear meshed on the rim.', 'Sa force tourne dans le mauvais sens : ajoutez ou retirez un engrenage engrené par la jante.'],
  'factory.interior.problem.jammed': ['Its Gears are jammed: they are fed in two opposite directions.', 'Ses engrenages sont bloqués : ils sont alimentés dans deux sens opposés.'],
  'factory.interior.problem.noFlow': ['No Flow reaches it: a Tank gives Flow only through a Pump that is handed Drive, then Pipes joined end to end, its inlet facing the line.', 'Aucun fluide ne l’atteint : un réservoir n’en donne que par une pompe alimentée en force, puis des tuyaux bout à bout, son entrée face à la ligne.'],
  'factory.interior.optional': ['The Factory works without an interior; the Machines only add a bonus, capped by its Tier.', "L'usine fonctionne sans intérieur ; les machines ajoutent seulement un bonus, plafonné par son niveau."],
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
