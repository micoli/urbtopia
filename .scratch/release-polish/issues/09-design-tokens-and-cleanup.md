# Design tokens and cleanup

Status: ready-for-agent
Blocked by: none
Spec: ../spec.md

## Acceptance criteria

- [ ] Tokens for colors, spacing, radii, typography, elevations and states, light and dark if needed; the ~165 hard-coded colors of `src/styles.css` migrated component by component, Storybook as reference.
- [ ] A chosen font and one icon set replacing the emoji/PNG mix.
- [ ] `LayoutBottomMenu` removed; the radial and left bar layouts kept, default by device (radial on a portrait phone, left bar otherwise), changeable in preferences.
- [ ] Tailwind removed; `radix-ui` removed or adopted only to replace `Dropdown`, `Dialog` and `AccordionSection`; no dead dependency left.
- [ ] The inline `style={{}}` uses reduced to the ones that must be dynamic.
- [ ] Baselines and stories show no regression.
