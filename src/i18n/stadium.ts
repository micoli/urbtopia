import { STADIUM } from '../core/leisure/stadium';

type StadiumMessageKey = 'building.stadium' | 'build.sport' | 'codex.description.stadium' | 'event.unlocked.stadium';

export function stadiumMessages(language: 'en' | 'fr'): Record<StadiumMessageKey, string> {
  const { width, depth } = STADIUM.footprint;
  return language === 'en'
    ? {
      'building.stadium': 'Athletics stadium',
      'build.sport': 'Sport',
      'codex.description.stadium': `A Leisure building with a 400 m track, a long jump pit and a pole vault mat. It raises the Well-being of Homes in a ${2 * STADIUM.radius}-tile square around it (+${STADIUM.wellbeingBonus}, like a service) and needs no power. It covers ${width}×${depth} tiles; unlocks at ${STADIUM.unlockCitizens} Citizens, costs ${STADIUM.cost} Urbs.`,
      'event.unlocked.stadium': 'New leisure building available: Athletics stadium.',
    }
    : {
      'building.stadium': 'Stade d’athlétisme',
      'build.sport': 'Sport',
      'codex.description.stadium': `Un bâtiment de loisirs avec une piste de 400 m, une fosse de saut en longueur et un tapis de saut à la perche. Il augmente le bien-être des logements à moins de ${2 * STADIUM.radius} cases (+${STADIUM.wellbeingBonus}) et ne consomme pas d’électricité. Il occupe ${width}×${depth} cases ; se débloque à ${STADIUM.unlockCitizens} citoyens, coûte ${STADIUM.cost} Urbs.`,
      'event.unlocked.stadium': 'Nouveau bâtiment de loisirs disponible : Stade d’athlétisme.',
    };
}
