# 09: Layer of workplaces by fill rate

Status: done
Blocked by: 04

**What to build:** A data Layer in the Analytics view that colours the workplaces by the share of their Jobs that are filled, so the player can see which buildings have no employees without opening each panel.

- [ ] `data.jobs` added to `DATA_LAYERS`, with its scale, legend and probe (filled / offered, modes).
- [ ] Workplaces with no Job offered are not painted.
- [ ] English and French labels; Storybook story.
- [ ] Documented in the Analytics article of the Guide and the Codex.

## Comments

- Delivered as the alternative the ticket allows: a list of the workplaces with the most unfilled Jobs in the Traffic section, each with a Show button (`unfilledWorkplaces`, `UnfilledJobsList`). The Analytics Layer `data.jobs` was not built: Layers paint tiles and Homes, not workplaces, so it needs a scene change of its own.
