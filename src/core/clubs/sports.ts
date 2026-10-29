import { registerSportRules } from './sportRules';
import { BASEBALL_RULES } from './baseball/baseball';
import { FOOTBALL_RULES } from './football/football';

registerSportRules('footballStadium', FOOTBALL_RULES);
registerSportRules('baseballField', BASEBALL_RULES);
