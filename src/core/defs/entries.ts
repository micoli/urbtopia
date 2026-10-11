// Files loaded by import.meta.glob, keyed by path: each becomes an entry named after its file, in the position its id holds in `order` (the ids of assets/defs/order/<directory>.json).
// An id missing from `order` goes last; a test of every collection keeps the two in step.
export function entriesOf<T, Id extends string = string>(files: Record<string, T & { $schema?: string }>, order: readonly string[]): (T & { id: Id })[] {
  const position = (id: string) => {
    const index = order.indexOf(id);
    return index === -1 ? order.length : index;
  };
  return Object.entries(files)
    .map(([path, { $schema: _schema, ...definition }]) => ({ ...(definition as unknown as T), id: path.slice(path.lastIndexOf('/') + 1, -'.json'.length) as Id }))
    .sort((a, b) => position(a.id) - position(b.id) || a.id.localeCompare(b.id));
}
