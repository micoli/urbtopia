type PuzzleMessageKey =
  | 'puzzle.title'
  | 'puzzle.card.title'
  | 'puzzle.card.text'
  | 'puzzle.difficulty.easy'
  | 'puzzle.difficulty.medium'
  | 'puzzle.difficulty.hard'
  | 'puzzle.aim.deliver'
  | 'puzzle.aim.light'
  | 'puzzle.aim.flip'
  | 'puzzle.aim.collect'
  | 'puzzle.tray'
  | 'puzzle.part.ramp'
  | 'puzzle.part.conveyor'
  | 'puzzle.part.trampoline'
  | 'puzzle.part.spring'
  | 'puzzle.part.seesaw'
  | 'puzzle.part.fan'
  | 'puzzle.run'
  | 'puzzle.reset'
  | 'puzzle.stop'
  | 'puzzle.undo'
  | 'puzzle.clear'
  | 'puzzle.takeBack'
  | 'puzzle.close'
  | 'puzzle.solved'
  | 'puzzle.failed';

const texts: Record<PuzzleMessageKey, [string, string]> = {
  'puzzle.title': ['Daily puzzle', 'Puzzle du jour'],
  'puzzle.card.title': ['Daily puzzle', 'Puzzle du jour'],
  'puzzle.card.text': ['Build a machine with the Parts you are given and bring the ball to its goal. A new puzzle every day, the same for every Player.', 'Construisez une machine avec les pièces fournies pour mener la balle à son but. Un nouveau puzzle chaque jour, le même pour tous les joueurs.'],
  'puzzle.difficulty.easy': ['Easy', 'Facile'],
  'puzzle.difficulty.medium': ['Medium', 'Moyen'],
  'puzzle.difficulty.hard': ['Hard', 'Difficile'],
  'puzzle.aim.deliver': ['Bring the ball to the target', 'Amener la balle dans la cible'],
  'puzzle.aim.light': ['Light every candle', 'Allumer toutes les bougies'],
  'puzzle.aim.flip': ['Switch on every lever', 'Activer tous les leviers'],
  'puzzle.aim.collect': ['Collect every star, then reach the exit', 'Ramasser toutes les étoiles, puis atteindre la sortie'],
  'puzzle.tray': ['Parts to use', 'Pièces à utiliser'],
  'puzzle.part.ramp': ['Ramp', 'Rampe'],
  'puzzle.part.conveyor': ['Conveyor', 'Tapis'],
  'puzzle.part.trampoline': ['Trampoline', 'Trampoline'],
  'puzzle.part.spring': ['Spring', 'Ressort'],
  'puzzle.part.seesaw': ['Seesaw', 'Bascule'],
  'puzzle.part.fan': ['Fan', 'Ventilateur'],
  'puzzle.run': ['Run', 'Lancer'],
  'puzzle.reset': ['Back to the start', 'Remettre à zéro'],
  'puzzle.stop': ['Stop', 'Arrêter'],
  'puzzle.undo': ['Undo', 'Annuler'],
  'puzzle.clear': ['Take everything back', 'Tout retirer'],
  'puzzle.takeBack': ['Take it back', 'Reprendre la pièce'],
  'puzzle.close': ['Close', 'Fermer'],
  'puzzle.solved': ['Solved! The ball reached its goal.', 'Résolu ! La balle a atteint son but.'],
  'puzzle.failed': ['The goal is not reached. Change the machine and run it again.', 'Le but n’est pas atteint. Modifiez la machine et relancez.'],
};

export function puzzleMessages(language: 'en' | 'fr'): Record<PuzzleMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<PuzzleMessageKey, string>;
}
