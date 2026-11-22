import { en, engineRoomScenario, piece } from './engineRoomScenario';

const name = en('Coal power plant', 'Centrale à charbon');
const circuit = en('Lay the coal, water, steam and electricity links.', 'Poser les liens de charbon, d’eau, de vapeur et d’électricité.');

const labels = {
  quay: en('the Coal quay', 'le quai à charbon'), conveyor: en('a Coal conveyor', 'un tapis à charbon'), boiler: en('the Steam boiler', 'la chaudière à vapeur'), inlet: en('the Water inlet', 'l’arrivée d’eau'),
  pipe: en('a Water pipe', 'un tuyau d’eau'), elbow: en('a Water pipe elbow', 'un coude de tuyau d’eau'), steam: en('a Steam pipe', 'un tuyau de vapeur'), alternator: en('the Alternator', 'l’alternateur'),
  cableElbow: en('a Cable elbow', 'un coude de câble'), cable: en('a Cable', 'un câble'), outlet: en('the Power outlet', 'la sortie d’électricité'),
};

// The Coal quay and the Water inlet stand against the back wall and feed the boiler, whose steam drives the Alternator; its Cable climbs back to the Power outlet on the same wall.
const pieces = () => [
  piece('quay', 'coalPlantCoalQuay', 2, 0, 0, labels.quay, en('The Coal quay stands against the back wall and unloads the coal onto a Conveyor.', 'Le quai à charbon se tient contre le mur du fond et décharge le charbon sur un tapis.')),
  piece('conveyor', 'coalPlantConveyor', 2, 1, 0, labels.conveyor, en('The Conveyor carries the coal from its back to its front, toward the boiler.', 'Le tapis transporte le charbon de son dos vers son avant, vers la chaudière.')),
  piece('boiler', 'coalPlantSteamBoiler', 2, 2, 0, labels.boiler, en('The boiler takes coal at its back, water on its left and gives steam on its right.', 'La chaudière prend le charbon par son dos, l’eau par sa gauche et donne la vapeur par sa droite.')),
  piece('inlet', 'coalPlantWaterInlet', 1, 0, 0, labels.inlet, en('The Water inlet stands against the back wall and gives water toward the room.', 'L’arrivée d’eau se tient contre le mur du fond et donne l’eau vers la salle.')),
  piece('pipe', 'coalPlantWaterPipe', 1, 1, 0, labels.pipe, en('A straight Water pipe carries water from one side to the opposite one.', 'Un tuyau d’eau droit transporte l’eau d’un côté vers le côté opposé.')),
  piece('elbow', 'coalPlantWaterPipeElbow', 1, 2, 3, labels.elbow, en('The elbow turns the water toward the left side of the boiler.', 'Le coude tourne l’eau vers le côté gauche de la chaudière.')),
  piece('steam', 'coalPlantSteamPipe', 3, 2, 1, labels.steam, en('The Steam pipe carries the steam from the boiler to the Alternator.', 'Le tuyau de vapeur transporte la vapeur de la chaudière à l’alternateur.')),
  piece('alternator', 'coalPlantAlternator', 4, 2, 0, labels.alternator, en('The Alternator turns the steam into electricity, which leaves on its right.', 'L’alternateur transforme la vapeur en électricité, qui sort par sa droite.')),
  piece('cable-elbow', 'coalPlantCableElbow', 5, 2, 2, labels.cableElbow, en('The Cable elbow turns the electricity toward the back wall.', 'Le coude de câble tourne l’électricité vers le mur du fond.')),
  piece('cable', 'coalPlantCable', 5, 1, 0, labels.cable, en('A straight Cable carries the electricity on.', 'Un câble droit fait suivre l’électricité.')),
  piece('outlet', 'coalPlantPowerOutlet', 5, 0, 0, labels.outlet, en('The Power outlet stands against the back wall and sends the electricity to the city. The Circuit is complete.', 'La sortie d’électricité se tient contre le mur du fond et envoie l’électricité à la ville. Le circuit est complet.')),
];

export const coalPlantSimple = engineRoomScenario({
  type: 'coalPlant', name, level: 'simple', circuitDescription: circuit, pieces: pieces(),
  intro: { title: en('A first Coal circuit', 'Un premier circuit à charbon'), objective: en('Link the quay, the boiler, the Alternator and the Power outlet.', 'Relier le quai, la chaudière, l’alternateur et la sortie d’électricité.'),
    explanation: en('A Circuit only counts once every link is laid: coal and water into the boiler, steam to the Alternator, electricity to the Power outlet. It then raises the Capacity of the plant and lowers its pollution.', 'Un circuit ne compte que lorsque tous les liens sont posés : charbon et eau vers la chaudière, vapeur vers l’alternateur, électricité vers la sortie. Il augmente alors la capacité de la centrale et diminue sa pollution.'),
    summary: en('Build one complete Coal circuit.', 'Construire un circuit à charbon complet.') },
});

export const coalPlantAdvanced = engineRoomScenario({
  type: 'coalPlant', name, level: 'advanced', circuitDescription: circuit, faulty: { fixtureId: 6, x: 1, y: 2, rotation: 3, label: labels.elbow },
  pieces: pieces().map(item => (item.id === 'elbow' ? { ...item, rotation: 1 as const } : item)),
  intro: { title: en('A circuit that counts for nothing', 'Un circuit qui ne compte pas'), objective: en('Find why the Circuit is not complete and fix it.', 'Trouver pourquoi le circuit n’est pas complet et le corriger.'),
    explanation: en('The Water pipe elbow will be turned the wrong way. You will lay the Circuit, see that it does not count, then turn the elbow.', 'Le coude du tuyau d’eau sera tourné à l’envers. Tu vas poser le circuit, constater qu’il ne compte pas, puis tourner le coude.'),
    summary: en('Diagnose and repair a Coal circuit with a misturned elbow.', 'Diagnostiquer et réparer un circuit à charbon dont un coude est mal tourné.') },
});
