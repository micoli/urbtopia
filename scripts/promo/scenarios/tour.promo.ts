import { scenario, scene } from '../types.ts';

export default scenario('tour', [
  scene('intro', { state: 'saves/ideal-city.json', language: 'en' }, async (stage) => {
    await stage.caption('Welcome to Urbtopia', 2500);
    await stage.flyTo(64, 64, 60, 3);
    await stage.wait(1000);
  }),
  scene('growth', { state: 'saves/evolved-city.json', language: 'en' }, async (stage) => {
    await stage.caption('Watch your city live through the days');
    await stage.timelapse({ hours: 2, seconds: 8 });
    await stage.hideCaption();
  }),
]);
