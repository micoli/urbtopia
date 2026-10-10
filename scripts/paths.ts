// Writes a value at a path of nested objects and arrays, copying what it crosses; undefined removes the key.
export function setIn(value: unknown, path: readonly (string | number)[], next: unknown): unknown {
  if (!path.length) return next
  const [head, ...rest] = path
  if (Array.isArray(value) || typeof head === 'number') {
    const copy = [...((value as unknown[] | undefined) ?? [])]
    copy[head as number] = setIn(copy[head as number], rest, next)
    return copy
  }
  const object = { ...((value as Record<string, unknown> | undefined) ?? {}) }
  const child = setIn(object[head!], rest, next)
  if (child === undefined) delete object[head!]
  else object[head!] = child
  return object
}

// A reference path such as `models.growth.2`, with array indexes as numbers.
export const pathOf = (dotted: string): (string | number)[] => dotted.split('.').map(part => (/^\d+$/.test(part) ? Number(part) : part))
