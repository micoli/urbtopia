import { OBJECTIVE_ENTRIES } from '../core/politics/objectives';
import { ORDINANCE_ENTRIES } from '../core/politics/ordinances';
import type { ObjectiveId } from '../core/politics/objectiveTypes.generated';
import type { OrdinanceId } from '../core/politics/ordinanceTypes.generated';

const texts = {
  'politics.title': ['Politics', 'Politique'],
  'politics.open': ['Politics', 'Politique'],
  'politics.rules': ['Rules', 'Règles'],
  'politics.inactive': ['Politics starts from the Easy Difficulty, once a Town hall is built.', 'La politique commence à partir de la difficulté Facile, une fois l’hôtel de ville construit.'],
  'politics.adapting': ['The city is adapting: no Demonstration and no loss of Approval for {days} more days.', 'La ville s’adapte : ni manifestation ni perte d’approbation pendant encore {days} jours.'],
  'townHall.politics': ['Politics', 'Politique'],
  'townHall.approval': ['Approval {approval}', 'Approbation {approval}'],
  'townHall.term': ['Term {number}: {days} days left', 'Mandat {number} : {days} jours restants'],
  'politics.summary': ['Summary', 'Résumé'],
  'politics.approval': ['Approval', 'Approbation'],
  'politics.term': ['Term {number}', 'Mandat {number}'],
  'politics.termLeft': ['{days} days left before the Election', '{days} jours avant l’élection'],
  'politics.noElection': ['No Election on this Difficulty.', 'Pas d’élection à cette difficulté.'],
  'politics.mandate': ['Council mandate', 'Mandat du Conseil'],
  'politics.summary.ordinances': ['Adopted Ordinances', 'Ordonnances adoptées'],
  'politics.summary.passing': ['Would pass today', 'Voteraient aujourd’hui'],
  'politics.summary.objectives': ['Active Objectives', 'Objectifs en cours'],
  'politics.summary.petitions': ['Open Petitions', 'Pétitions ouvertes'],
  'politics.summary.demonstrations': ['Demonstrations', 'Manifestations'],
  'politics.summary.grants': ['Grants waiting', 'Subventions à percevoir'],
  'politics.journal': ['Recently', 'Récemment'],
  'politics.journal.empty': ['Nothing happened yet.', 'Rien ne s’est encore passé.'],
  'politics.journal.objectiveCompleted': ['Objective reached: {subject}', 'Objectif atteint : {subject}'],
  'politics.journal.petitionFiled': ['New Petition: {subject}', 'Nouvelle pétition : {subject}'],
  'politics.journal.petitionHandled': ['Petition handled: {subject}', 'Pétition traitée : {subject}'],
  'politics.journal.demonstration': ['Demonstration: {subject}', 'Manifestation : {subject}'],
  'politics.journal.ordinanceLapsed': ['Ordinance lapsed, upkeep unpaid: {subject}', 'Ordonnance caduque, entretien impayé : {subject}'],
  'politics.journal.election': ['Election held', 'Élection tenue'],
  'politics.council': ['Council', 'Conseil'],
  'politics.council.seats': ['{seats} seats', '{seats} sièges'],
  'politics.council.label': ['Council of {seats} seats: {detail}', 'Conseil de {seats} sièges : {detail}'],
  'politics.council.for': ['for', 'pour'],
  'politics.council.against': ['against', 'contre'],
  'politics.council.lastElection': ['Last Election: Approval {approval}', 'Dernière élection : approbation {approval}'],
  'faction.economy': ['Economy', 'Économie'],
  'faction.environment': ['Environment', 'Environnement'],
  'faction.services': ['Services', 'Services'],
  'politics.ordinances': ['Ordinances', 'Ordonnances'],
  'politics.ordinance.adopted': ['Adopted', 'Adoptée'],
  'politics.ordinance.locked': ['Unlocks at {citizens} Citizens', 'Se débloque à {citizens} citoyens'],
  'politics.ordinance.waiting': ['Refused: try again in {days} days', 'Refusée : réessayez dans {days} jours'],
  'politics.ordinance.excluded': ['Repeal {name} first', 'Abrogez d’abord {name}'],
  'politics.ordinance.upkeep': ['Upkeep {amount} Urbs per day', 'Entretien {amount} Urbs par jour'],
  'politics.ordinance.noUpkeep': ['No upkeep', 'Sans entretien'],
  'politics.ordinance.forecast': ['Forecast: {seatsFor} of {seats} seats', 'Pronostic : {seatsFor} sièges sur {seats}'],
  'politics.ordinance.passes': ['would pass', 'passerait'],
  'politics.ordinance.fails': ['would be refused', 'serait refusée'],
  'politics.ordinance.popular': ['Popular', 'Populaire'],
  'politics.propose': ['Propose', 'Proposer'],
  'politics.repeal': ['Repeal', 'Abroger'],
  'politics.objectives': ['Objectives', 'Objectifs'],
  'politics.objective.progress': ['{held} of {hold} days held', '{held} jours tenus sur {hold}'],
  'politics.objective.now': ['Now {value}, target {target}', 'Actuel {value}, cible {target}'],
  'politics.objective.grant': ['Grant {amount} Urbs', 'Subvention {amount} Urbs'],
  'politics.objective.none': ['No Objective yet: grow your city.', 'Aucun objectif pour l’instant : faites grandir la ville.'],
  'politics.objective.atMost': ['at most', 'au plus'],
  'politics.objective.atLeast': ['at least', 'au moins'],
  'politics.claim': ['Claim {amount} Urbs', 'Percevoir {amount} Urbs'],
  'objective.metric.vitalSatisfaction': ['Vital Need level', 'Niveau de besoins vitaux'],
  'objective.metric.wasteCoverage': ['Homes covered by Waste collection', 'Logements couverts par la collecte'],
  'objective.metric.congestion': ['Congestion', 'Congestion'],
  'objective.metric.greenShare': ['Citizens with a Green space in reach', 'Habitants avec un espace vert à portée'],
  'objective.metric.citizens': ['Citizens', 'Habitants'],
  'politics.petitions': ['Petitions', 'Pétitions'],
  'politics.petition.none': ['No open Petition.', 'Aucune pétition ouverte.'],
  'politics.petition.escalated': ['Demonstration', 'Manifestation'],
  'politics.petition.district': ['District {x}, {y}', 'Quartier {x}, {y}'],
  'politics.petition.age': ['{days} days', '{days} jours'],
  'politics.petition.missing': ['Missing: {cause}', 'Manque : {cause}'],
  'politics.support': ['Support', 'Soutiens'],
  'politics.support.none': ['No Support yet.', 'Aucun soutien pour l’instant.'],
  'politics.support.greenSpaces': ['Citizens welcome their Green spaces', 'Les habitants apprécient leurs espaces verts'],
  'politics.support.walking': ['Citizens welcome getting about on foot', 'Les habitants apprécient de se déplacer à pied'],
  'politics.support.culture': ['Citizens welcome their culture', 'Les habitants apprécient leur offre culturelle'],
  'event.ordinanceAdopted': ['The Council adopted the Ordinance.', 'Le Conseil a adopté l’ordonnance.'],
  'event.ordinanceRejected': ['The Council refused the Ordinance.', 'Le Conseil a refusé l’ordonnance.'],
  'event.ordinanceRepealed': ['Ordinance repealed.', 'Ordonnance abrogée.'],
  'event.grantsClaimed': ['Grants collected.', 'Subventions perçues.'],
} as const satisfies Record<string, readonly [string, string]>;

type TextKey = keyof typeof texts;
type OrdinanceKey = `ordinance.${OrdinanceId}.${'name' | 'description'}`;
type ObjectiveKey = `objective.${ObjectiveId}.${'name' | 'description'}`;

export type PoliticsMessageKey = TextKey | OrdinanceKey | ObjectiveKey;

export function politicsMessages(language: 'en' | 'fr'): Record<PoliticsMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const fixed = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  const ordinances = ORDINANCE_ENTRIES.flatMap(entry => [[`ordinance.${entry.id}.name`, entry.name[language]], [`ordinance.${entry.id}.description`, entry.description[language]]]);
  const objectives = OBJECTIVE_ENTRIES.flatMap(entry => [[`objective.${entry.id}.name`, entry.name[language]], [`objective.${entry.id}.description`, entry.description[language]]]);
  return Object.fromEntries([...fixed, ...ordinances, ...objectives]) as Record<PoliticsMessageKey, string>;
}
