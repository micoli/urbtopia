import { en, engineRoomScenario, piece } from './engineRoomScenario';

const labels = {
  inlet: en('the Underground water inlet', 'l’arrivée d’eau souterraine'), pipe: en('a Steam pipe', 'un tuyau de vapeur'), turbine: en('the Steam turbine', 'la turbine à vapeur'), condenser: en('the Condenser', 'le condenseur'),
  elbow: en('a Steam pipe elbow', 'un coude de tuyau de vapeur'), well: en('the Injection well', 'le puits d’injection'), cableElbow: en('a Cable elbow', 'un coude de câble'), cable: en('a Cable', 'un câble'), power: en('the Power outlet', 'la sortie d’électricité'),
};

// The steam goes down column 2 to the Steam turbine and the Condenser, turns at the front and climbs column 3 to the Injection well; the Cable leaves the turbine to the left and climbs column 1 to the Power outlet.
export const geothermalPlantSimple = engineRoomScenario({
  type: 'geothermalPlant', name: en('Geothermal power plant', 'Centrale géothermique'), level: 'simple', circuitDescription: en('Lay the steam and electricity links.', 'Poser les liens de vapeur et d’électricité.'),
  intro: { title: en('A first Geothermal circuit', 'Un premier circuit géothermique'), objective: en('Take the steam through the turbine and the Condenser, and the electricity to the Power outlet.', 'Faire passer la vapeur par la turbine et le condenseur, et l’électricité jusqu’à la sortie.'),
    explanation: en('The steam of the ground goes through the Steam turbine and the Condenser, then back down the Injection well; the turbine sends electricity down a Cable to the Power outlet. The Circuit then raises the Capacity of the plant.', 'La vapeur du sous-sol traverse la turbine à vapeur et le condenseur, puis redescend par le puits d’injection ; la turbine envoie l’électricité par un câble jusqu’à la sortie d’électricité. Le circuit augmente alors la capacité de la centrale.'),
    summary: en('Build one complete Geothermal circuit.', 'Construire un circuit géothermique complet.') },
  pieces: [
    piece('inlet', 'geothermalPlantUndergroundWaterInlet', 2, 0, 0, labels.inlet, en('The Underground water inlet stands against the back wall and gives steam toward the room.', 'L’arrivée d’eau souterraine se tient contre le mur du fond et donne la vapeur vers la salle.')),
    piece('pipe-1', 'geothermalPlantSteamPipe', 2, 1, 0, labels.pipe, en('A straight Steam pipe carries steam from one side to the opposite one.', 'Un tuyau de vapeur droit transporte la vapeur d’un côté vers le côté opposé.')),
    piece('pipe-2', 'geothermalPlantSteamPipe', 2, 2, 0, labels.pipe, en('Another pipe brings the steam to the turbine.', 'Un autre tuyau amène la vapeur à la turbine.')),
    piece('turbine', 'geothermalPlantSteamTurbine', 2, 3, 1, labels.turbine, en('The turbine takes the steam on its left, gives it on its right and sends electricity out of its front.', 'La turbine prend la vapeur par sa gauche, la donne par sa droite et envoie l’électricité par son avant.')),
    piece('condenser', 'geothermalPlantCondenser', 2, 4, 1, labels.condenser, en('The Condenser takes the steam leaving the turbine and gives it on.', 'Le condenseur prend la vapeur qui sort de la turbine et la transmet.')),
    piece('elbow-1', 'geothermalPlantSteamPipeElbow', 2, 5, 3, labels.elbow, en('The elbow turns the steam to the right.', 'Le coude tourne la vapeur vers la droite.')),
    piece('elbow-2', 'geothermalPlantSteamPipeElbow', 3, 5, 2, labels.elbow, en('A second elbow turns it back toward the wall.', 'Un deuxième coude la ramène vers le mur.')),
    piece('pipe-3', 'geothermalPlantSteamPipe', 3, 4, 0, labels.pipe, en('The steam climbs toward the back wall.', 'La vapeur remonte vers le mur du fond.')),
    piece('pipe-4', 'geothermalPlantSteamPipe', 3, 3, 0, labels.pipe, en('The pipe goes on.', 'Le tuyau continue.')),
    piece('pipe-5', 'geothermalPlantSteamPipe', 3, 2, 0, labels.pipe, en('The pipe goes on.', 'Le tuyau continue.')),
    piece('pipe-6', 'geothermalPlantSteamPipe', 3, 1, 0, labels.pipe, en('The last pipe reaches the wall.', 'Le dernier tuyau atteint le mur.')),
    piece('well', 'geothermalPlantInjectionWell', 3, 0, 0, labels.well, en('The Injection well stands against the back wall and sends the water back into the ground.', 'Le puits d’injection se tient contre le mur du fond et renvoie l’eau dans le sol.')),
    piece('cable-elbow', 'geothermalPlantCableElbow', 1, 3, 3, labels.cableElbow, en('The Cable elbow takes the electricity from the front of the turbine and turns it toward the wall.', 'Le coude de câble prend l’électricité à l’avant de la turbine et la tourne vers le mur.')),
    piece('cable-1', 'geothermalPlantCable', 1, 2, 0, labels.cable, en('A straight Cable carries the electricity on.', 'Un câble droit fait suivre l’électricité.')),
    piece('cable-2', 'geothermalPlantCable', 1, 1, 0, labels.cable, en('The Cable reaches the wall.', 'Le câble atteint le mur.')),
    piece('power', 'geothermalPlantPowerOutlet', 1, 0, 0, labels.power, en('The Power outlet sends the electricity to the city. The Circuit is complete.', 'La sortie d’électricité envoie l’électricité à la ville. Le circuit est complet.')),
  ],
});
