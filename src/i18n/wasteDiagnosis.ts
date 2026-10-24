const texts = {
  'diagnosis.waste.noFacility': [
    'The city produces {produced} units of Waste a day and has no Waste facility. Build a Mound, an Incinerator or a Recycling plant, and a Road to it.',
    'La ville produit {produced} unités de déchets par jour et n’a aucun équipement de traitement. Construisez un Mound, un incinérateur ou une usine de recyclage, et une route jusqu’à lui.',
  ],
  'diagnosis.waste.capacityShort': [
    'The city produces {produced} units of Waste a day for a capacity of {capacity}: {missing} are not processed. Add facilities (Mounds are cheap but smell, Recycling plants are clean but dear) or sort your Waste.',
    'La ville produit {produced} unités de déchets par jour pour une capacité de {capacity} : {missing} ne sont pas traitées. Ajoutez des équipements (les Mounds sont bon marché mais sentent, les usines de recyclage sont propres mais chères) ou triez vos déchets.',
  ],
  'diagnosis.waste.stopped.noUrbs': [
    '{count} Waste facilities are stopped because the city has no Urbs left to pay them, and {citizens} Citizens lose their Waste coverage. Earn Urbs first.',
    '{count} équipements de traitement sont arrêtés faute d’Urbs pour les payer, et {citizens} habitants perdent leur couverture. Gagnez d’abord des Urbs.',
  ],
  'diagnosis.waste.stopped.noRoad': [
    '{count} Waste facilities have no road link and process nothing, so {citizens} Citizens lose their Waste coverage. Link them to the Road network.',
    '{count} équipements de traitement n’ont aucun lien routier et ne traitent rien : {citizens} habitants perdent leur couverture. Reliez-les au réseau routier.',
  ],
  'diagnosis.waste.stopped.noPower': [
    '{count} Recycling plants lack power and process nothing, so {citizens} Citizens lose their Waste coverage. Add power.',
    '{count} usines de recyclage manquent d’électricité et ne traitent rien : {citizens} habitants perdent leur couverture. Ajoutez de l’énergie.',
  ],
  'diagnosis.waste.noRoadLink': [
    '{homes} Homes ({citizens} Citizens) have no road link to any Waste facility in their reach. Join their roads to a facility, or build one on their Road network.',
    '{homes} Homes ({citizens} habitants) n’ont aucun lien routier avec un équipement de traitement à leur portée. Reliez leurs routes à un équipement, ou construisez-en un sur leur réseau.',
  ],
  'diagnosis.waste.farFromFacilities': [
    '{homes} Homes ({citizens} Citizens) are out of reach of every Waste facility, or too far along the Pedestrian paths from its road. Build a facility nearby (a Recycling plant reaches farthest).',
    '{homes} Homes ({citizens} habitants) sont hors de portée de tout équipement de traitement, ou trop loin par les chemins piétons de sa route. Construisez un équipement à proximité (l’usine de recyclage porte le plus loin).',
  ],
  'diagnosis.waste.carriedSurcharge': [
    '{homes} Homes reached only by Pedestrian ways cost {extra} Urbs a day more to collect. Give them a Road.',
    '{homes} Homes desservis seulement par des voies piétonnes coûtent {extra} Urbs de plus par jour à desservir. Donnez-leur une route.',
  ],
  'diagnosis.waste.odor': [
    '{homes} Homes smell a Mound and lose Well-being. Move the Mounds away from the Homes, or replace them with Recycling plants.',
    '{homes} Homes sentent un Mound et perdent du bien-être. Éloignez les Mounds des Homes, ou remplacez-les par des usines de recyclage.',
  ],
  'diagnosis.waste.incinerator': [
    '{homes} Homes live near an Incinerator and lose Well-being. Move it away from the Homes, or replace it with a Recycling plant.',
    '{homes} Homes vivent près d’un incinérateur et perdent du bien-être. Éloignez-le des Homes, ou remplacez-le par une usine de recyclage.',
  ],
};

export type WasteDiagnosisMessageKey = keyof typeof texts;

export function wasteDiagnosisMessages(language: 'en' | 'fr'): Record<WasteDiagnosisMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<WasteDiagnosisMessageKey, string>;
}
