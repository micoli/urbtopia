import { en, engineRoomScenario, piece } from './engineRoomScenario';

const labels = {
  inlet: en('the Water inlet', 'l’arrivée d’eau'), pipe: en('a Water pipe', 'un tuyau d’eau'), turbine: en('the Water turbine', 'la turbine hydraulique'), elbow: en('a Water pipe elbow', 'un coude de tuyau d’eau'),
  outlet: en('the Water outlet', 'la sortie d’eau'), cableElbow: en('a Cable elbow', 'un coude de câble'), cable: en('a Cable', 'un câble'), power: en('the Power outlet', 'la sortie d’électricité'),
};

// The water goes down column 2 to the turbine, turns at the front and climbs column 3 to the Water outlet; the Cable leaves the turbine to the left and climbs column 1 to the Power outlet.
export const hydroPlantSimple = engineRoomScenario({
  type: 'hydroPlant', name: en('Hydro power plant', 'Centrale hydraulique'), level: 'simple', circuitDescription: en('Lay the water and electricity links.', 'Poser les liens d’eau et d’électricité.'),
  intro: { title: en('A first Hydro circuit', 'Un premier circuit hydraulique'), objective: en('Take the water through the turbine and the electricity to the Power outlet.', 'Faire passer l’eau par la turbine et l’électricité jusqu’à la sortie.'),
    explanation: en('The water goes in at the Water inlet, through the Water turbine, and back out at the Water outlet; the turbine sends electricity down a Cable to the Power outlet. The Circuit then raises the Capacity of the plant.', 'L’eau entre par l’arrivée d’eau, traverse la turbine hydraulique et ressort par la sortie d’eau ; la turbine envoie l’électricité par un câble jusqu’à la sortie d’électricité. Le circuit augmente alors la capacité de la centrale.'),
    summary: en('Build one complete Hydro circuit.', 'Construire un circuit hydraulique complet.') },
  pieces: [
    piece('inlet', 'hydroPlantWaterInlet', 2, 0, 0, labels.inlet, en('The Water inlet stands against the back wall and gives water toward the room.', 'L’arrivée d’eau se tient contre le mur du fond et donne l’eau vers la salle.')),
    piece('pipe-1', 'hydroPlantWaterPipe', 2, 1, 0, labels.pipe, en('A straight Water pipe carries water from one side to the opposite one.', 'Un tuyau d’eau droit transporte l’eau d’un côté vers le côté opposé.')),
    piece('pipe-2', 'hydroPlantWaterPipe', 2, 2, 0, labels.pipe, en('Another straight pipe brings the water to the turbine.', 'Un autre tuyau droit amène l’eau à la turbine.')),
    piece('turbine', 'hydroPlantWaterTurbine', 2, 3, 1, labels.turbine, en('The turbine takes the water on its left, gives it back on its right and sends electricity out of its front.', 'La turbine prend l’eau par sa gauche, la rend par sa droite et envoie l’électricité par son avant.')),
    piece('elbow-1', 'hydroPlantWaterPipeElbow', 2, 4, 3, labels.elbow, en('The elbow takes the water leaving the turbine and turns it to the right.', 'Le coude prend l’eau qui sort de la turbine et la tourne vers la droite.')),
    piece('elbow-2', 'hydroPlantWaterPipeElbow', 3, 4, 2, labels.elbow, en('A second elbow turns it back toward the wall.', 'Un deuxième coude la ramène vers le mur.')),
    piece('pipe-3', 'hydroPlantWaterPipe', 3, 3, 0, labels.pipe, en('The water climbs toward the back wall.', 'L’eau remonte vers le mur du fond.')),
    piece('pipe-4', 'hydroPlantWaterPipe', 3, 2, 0, labels.pipe, en('The pipe goes on.', 'Le tuyau continue.')),
    piece('pipe-5', 'hydroPlantWaterPipe', 3, 1, 0, labels.pipe, en('The last pipe reaches the wall.', 'Le dernier tuyau atteint le mur.')),
    piece('outlet', 'hydroPlantWaterOutlet', 3, 0, 0, labels.outlet, en('The Water outlet stands against the back wall and returns the water.', 'La sortie d’eau se tient contre le mur du fond et rend l’eau.')),
    piece('cable-elbow', 'hydroPlantCableElbow', 1, 3, 3, labels.cableElbow, en('The Cable elbow takes the electricity from the front of the turbine and turns it toward the wall.', 'Le coude de câble prend l’électricité à l’avant de la turbine et la tourne vers le mur.')),
    piece('cable-1', 'hydroPlantCable', 1, 2, 0, labels.cable, en('A straight Cable carries the electricity on.', 'Un câble droit fait suivre l’électricité.')),
    piece('cable-2', 'hydroPlantCable', 1, 1, 0, labels.cable, en('The Cable reaches the wall.', 'Le câble atteint le mur.')),
    piece('power', 'hydroPlantPowerOutlet', 1, 0, 0, labels.power, en('The Power outlet sends the electricity to the city. The Circuit is complete.', 'La sortie d’électricité envoie l’électricité à la ville. Le circuit est complet.')),
  ],
});
