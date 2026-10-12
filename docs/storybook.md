# Storybook

`npm run storybook` serves every component of `src/ui` (primitives in `ui/common`, then the panels). The UI is always in English. The 3D scene is out of scope: components that need a projected world position or a model thumbnail (`SceneCanvas`, `App`, `VenueCanvas`, `ParcelTags`, `SanctionBadges`, `CollectBadges`, `ReadyFieldBadges`, `WorkingIndicators`, `ItemIcon`) have no story.

A story sits next to its component (`Foo.stories.tsx`). The `.storybook/` folder has its own Vite config: the root one stamps the service worker and validates definitions, which Storybook must not do.

## Game state

Connected components read the real stores. The `withGame` decorator resets every store before each story and loads a game fixture, chosen with the `game` parameter:

| Fixture | City |
|---|---|
| `starter` (default) | New game, no tutorial |
| `tutorial` | New game with the tutorial |
| `rich` / `poor` | Starter city with 5 000 000 / 0 Urbs |
| `evolved` | The evolved city of the saves tests |
| `brokeEvolved` | Evolved city with no Urbs and no goods |
| `powerShortage` | Evolved city without Wind farms: sanctioned homes |
| `showcase` | Evolved city plus one building of every other type, venues with fixtures |

The `stores` parameter overrides the other stores: `ui`, `dialog`, `cloud`, `social`, `toast`, `readOnly`, `prefs`, `selectBuilding` (selects the first building of a type) and `setup` (a function run last).

```tsx
export const Open: Story = { parameters: { game: 'evolved', stores: { ui: { marketOpen: true } } } };
```

Components that take a building or the game state as a prop render inside `BuildingOfType`, `WithGameState` or `WithCityStats` (from `.storybook/`).

## Checks

`npm run build-storybook && npm run test:storybook` builds the site, opens every story in Chromium and fails on a page error or an empty render. CI runs both.
