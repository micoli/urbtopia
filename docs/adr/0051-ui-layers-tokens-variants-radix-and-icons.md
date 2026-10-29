---
status: accepted
---

# UI: legacy CSS in a layer, tokens as the source of truth, closed variants, Radix and named icons

The interface was plain CSS written by hand, one file per area, with design tokens in `tokens.css`. The look was dated and drifted from screen to screen: shared components such as `ActionButton` were restyled from other contexts (`.banner .action-button`, `.casino-games .action-button`), emojis stood in for icons, and nothing moved. A look and a way of working were chosen together. Several choices look odd without context.

**The game CSS lives in a `legacy` layer, below the Tailwind utilities.** `styles.css` declares `@layer theme, legacy, utilities` and imports every file with `layer(legacy)`. Unlayered CSS beats any layer, so without this a rule like `button { font: inherit }` in `base.css` cancelled `font-bold`. Any new CSS file must go in the layer, including the ones a component imports itself (`blockmatch.css`, `devtools.css` wrap their content in `@layer legacy`). `common/tailwind.css` repeats the layer statement so that the order holds whichever file is loaded first.

**Tokens stay the source of truth; utilities only read them.** `tailwind.css` maps the game tokens to `ui-*` names in an `@theme inline` block (`bg-ui-accent`, `rounded-ui-lg`). There is no Tailwind preflight, so nothing global changes. `build/cssTokens.test.ts` forbids literal colours, radii and font sizes in the game CSS; the art of Blockmatch, the dev tools, the guide and `tokens.css` are exempt.

**Shared components have closed variants, built with `cva`.** `ActionButton` takes `variant`, `size`, `block` and `overlay`; a context that needs a different look gets a prop, not a CSS override. Descendant selectors that only set layout (button rows, casino tiles) still work, because the element keeps its `action-button` class as a hook. Components that already had closed variants in CSS (`Note`, `ButtonRow`, `IconButton`) were not migrated: it would change nothing.

**`Dialog` is built on Radix, and is always open.** The parent mounts it while it applies, and only its own buttons close it: Escape and a click outside are ignored, as before. The backdrop keeps wrapping the box, so the existing selectors and the static-render tests still work (no portal). A dialog with no title gets a hidden one (`dialog.untitled`), which Radix requires for an accessible name.

**Icons go through `<Icon name>` and `lucide-react`.** `iconRegistry.ts` names every icon; props that took an emoji (`SectionHeading`, `StatChip`, `NavAction`, …) now take an `IconName`, so a forgotten emoji fails the typecheck. The art of the casino, the arrows inside sentences, and glyphs that tests read as table values stay as text.

**The look is Glass.** A translucent dark surface with a blur (`--surface-blur`), larger radii, a mint accent and Inter. Every floating surface shares the blur (`glass.css`). Entrances, hover, press and focus feedback use the motion tokens and stop under `prefers-reduced-motion`.

## Rejected

- **All-Tailwind, or a kit (shadcn/ui, Mantine).** A rewrite of about 117 KB of CSS for a look the tokens already give. Mantine would also impose its own theme.
- **Keeping the descendant overrides and raising their specificity.** It hides the drift instead of removing it.

## Consequences

- A change of look is mostly a change of `tokens.css`.
- A new shared component gets its variants with `cva`, reads the `ui-*` theme, and imports `common/tailwind.css`.
- Migrating a component means moving its contextual overrides to props first; a computed-style comparison before and after (Storybook stories, headless browser) caught the regressions of the `ActionButton` migration.
- `Dialog` focuses its first button on opening, which shows a focus ring for keyboard users.
