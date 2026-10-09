# New editor shell

Status: ready-for-agent
Spec: [game-object-editor](../spec.md)
Blocked by: 01, 02

Rebuild `tools/assets-editor` UI on Tailwind, Radix and dnd-kit: kind navigation and object list (search, filters, error badges), tabbed centre form, 3D preview, model library drawer (thumbnails, source, license, used by or orphan). Generic Building form generated from the schema, id comboboxes, live validation. Drag a model onto a model field; drop `.glb`, `.zip` or a Poly Pizza URL anywhere to import. Create, Duplicate, Retire; model Rename. In-memory edits with dirty markers, undo and redo, Cmd+S atomic save refused on errors. Reorder within a build menu section. Former source tree view becomes the library.
