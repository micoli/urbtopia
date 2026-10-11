# Évolutions du jeu

## Gameplay

- **Besoins** : le Well-being s'affiche en pyramide des Needs sur la page de gestion de la ville.
- **Énergie** : nouvelles centrales hydrauliques et géothermiques, éolienne basse pour le palier de base. Elles apparaissent dans les panneaux bâtiment et stats.
- **Stockage** : 4 paliers pour l'entrepôt et le silo à grain. Le stock s'affiche en tuiles avec icônes d'items.
- **Bâtiments** : plusieurs stockages, fermes et packhouses autorisés. Le Silo devient *Material depot*.
- **Habitat** : maisons mansardées avec 5 paliers d'étages, variantes de couleur a–d avec versions solaires.
- **Production** : roue de travail avec quarts radiaux et recettes, rayon affiché quand le bâtiment en a un. La répartition des quarts dépend maintenant du nombre d'entrées de la file (plus de la durée), travail en cours.
- **Collecte** : aperçus 3D des items prêts.

## Codex

- Seuils de Citizens listés pour chaque menu de construction.
- Profil et flux de production des centrales.
- Page de production d'énergie en direct.

## Assets

- Modèles low-poly 3D pour biens et matériaux.
- Nouveaux modèles : cult, venue, marina captaincy (variante étroite), réservoir industriel, bâtiment J, maisons d'habitation.
- Venues réutilisées pour l'arcade, la captaincy et le supermarché (`rotationOffset`).
- Skill `create-building-model` pour générer des bâtiments dans Blender.

## Outillage

- Tracker d'issues local (`issues-server`), avec son propre job CI.
- Ordre des menus déplacé dans des fichiers `order` séparés, renumérotation des bâtiments.
- Correctifs lint, cache Vite dédié pour l'assets-editor, bump des actions GitHub.
