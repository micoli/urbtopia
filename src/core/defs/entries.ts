// Files loaded by import.meta.glob, keyed by path: each becomes an entry named after its file, in its `order`.
export function entriesOf<T extends { order?: number }, Id extends string = string>(files: Record<string, T & { $schema?: string }>): (T & { id: Id })[] {
  return Object.entries(files)
    .map(([path, { $schema: _schema, ...definition }]) => ({ ...(definition as unknown as T), id: path.slice(path.lastIndexOf('/') + 1, -'.json'.length) as Id }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id));
}
