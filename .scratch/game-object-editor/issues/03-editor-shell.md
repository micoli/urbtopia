# New editor shell

Status: resolved
Spec: [game-object-editor](../spec.md)
Blocked by: 01, 02

Rebuild `tools/assets-editor` UI on Tailwind, Radix and dnd-kit: kind navigation and object list (search, filters, error badges), tabbed centre form, 3D preview, model library drawer (thumbnails, source, license, used by or orphan). Generic Building form generated from the schema, id comboboxes, live validation. Drag a model onto a model field; drop `.glb`, `.zip` or a Poly Pizza URL anywhere to import. Create, Duplicate, Retire; model Rename. In-memory edits with dirty markers, undo and redo, Cmd+S atomic save refused on errors. Reorder within a build menu section. Former source tree view becomes the library.

## Comments

Delivered (2026-10-09):

- New shell on Tailwind 4, Radix and dnd-kit: Buildings and Models navigation, building list grouped by section (sortable within a section), schema-driven forms (`src/schema/fields.ts` turns the JSON Schemas into typed controls), 3D preview, model library with lazily rendered thumbnails and used, orphan and undefined filters.
- Document in a zustand store: in-memory edits, dirty markers, undo and redo (⌘Z, ⇧⌘Z), ⌘S saves models and buildings together through `PUT /api/definitions`, refused while the live checks (`scripts/definitionProblems.ts`, shared with the build) report a problem.
- Drag a library model onto a model field (a CC0 Kenney or Quaternius model gets its definition in the same undo step); drop a GLB, a zip or a Poly Pizza link anywhere to import it, pending edits kept.
- Create and Duplicate (id fixed at creation), Retire and Restore (`retired: true`: hidden from the build menu and codex, not placeable, no unlock announcement, still loaded), Delete only for buildings that no save fixture holds; model Rename and Remove definition.
- A building can use any model of an installable pack: pack files are now the listed files plus every building model, and the reference check asks whether a file can ship rather than whether it is listed.
- The transitional file-keyed views of issue 02 are gone.
