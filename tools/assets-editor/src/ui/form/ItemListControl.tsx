import type { CollectionName } from '../../../../../scripts/collections'
import { useDocument } from '../../store/documentStore'
import { ChoicesControl } from './ChoicesControl'

interface Props {
  value: string[] | undefined
  targets: readonly CollectionName[]
  onChange: (value: string[] | undefined) => void
}

// A list of ids of other collections, such as the Goods a Shop sells.
export function ItemListControl({ value, targets, onChange }: Props) {
  const collections = useDocument(state => state.doc.collections)
  const options = targets.flatMap(target => Object.keys(collections[target]))
  return <ChoicesControl value={value} options={[...options, ...(value ?? []).filter(id => !options.includes(id))]} onChange={onChange} />
}
