# Good category on every Good

Status: resolved
Spec: [shop-categories](../spec.md)

Add a closed `category` enum (Construction, Food, Equipment, Luxury) to the Good zod schema, regenerate `good.schema.json` and id unions, and set the category of the 11 existing Goods with a one-off script. Assets editor: label in `fields.ts`, hover doc in `fieldDocs.ts`, default in `edits.ts` (category required), tests. Game behaviour unchanged.

Acceptance:
- Every Good file has a valid `category`; the schema-staleness test passes.
- The editor shows and edits the category with its hover doc.
