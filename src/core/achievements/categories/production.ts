import type { AchievementDef } from '../achievementTypes';

export const PRODUCTION: readonly AchievementDef[] = [
  { id: 'production.firstHarvest', category: 'production', trigger: { type: 'sim', event: 'CropsHarvested' },
    name: { en: 'First harvest', fr: 'Première récolte' }, description: { en: 'Harvest a Crop.', fr: 'Récoltez une Crop.' } },
  { id: 'production.firstProduction', category: 'production', trigger: { type: 'sim', event: 'ProductionCompleted' },
    name: { en: 'Workshop at work', fr: 'Atelier en marche' }, description: { en: 'Complete a production in a Workshop.', fr: 'Terminez une production dans un Workshop.' } },
  { id: 'production.shop', category: 'production', trigger: { type: 'created', counter: 'kind:shop' },
    name: { en: 'Open for business', fr: 'Ouvert aux affaires' }, description: { en: 'Place a Shop.', fr: 'Posez un Shop.' } },
  { id: 'production.storage', category: 'production', trigger: { type: 'created', counter: 'kind:storage' },
    name: { en: 'Stocked up', fr: 'Entrepôt garni' }, description: { en: 'Place a Storehouse or another storage building.', fr: 'Posez un Storehouse ou un autre bâtiment de stockage.' } },
  { id: 'production.market', category: 'production', trigger: { type: 'command', commands: ['SellToMarket'] },
    name: { en: 'Goods on the Market', fr: 'Biens sur le Market' }, description: { en: 'Sell a Good on the Market.', fr: 'Vendez un Good sur le Market.' } },
];
