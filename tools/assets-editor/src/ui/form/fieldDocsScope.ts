import { createContext } from 'react'

// The scopes a form narrows its field documentation to, most specific first: a kind of building, then the collection.
export const FieldDocsScope = createContext<readonly string[]>([])
