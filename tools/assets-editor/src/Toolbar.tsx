interface Props {
  packs: string[]
  pack: string
  search: string
  sourceFilter: string
  overview: boolean
  onSearch: (value: string) => void
  onSourceFilter: (value: string) => void
  onPack: (pack: string) => void
  onOverview: () => void
  onAdd: () => void
  onRotate: () => void
}

export const SOURCE_FILTERS = ['all', 'kenney', 'quaternius', 'managed', 'poly.pizza', 'other']

export function Toolbar({ packs, pack, search, sourceFilter, overview, onSearch, onSourceFilter, onPack, onOverview, onAdd, onRotate }: Props) {
  return (
    <div id="bar">
      <input id="global-search" type="search" placeholder="Search all assets" aria-label="Search all assets" value={search} onChange={(event) => onSearch(event.target.value)} />
      <select aria-label="Source" value={sourceFilter} onChange={(event) => onSourceFilter(event.target.value)}>
        {SOURCE_FILTERS.map((source) => <option key={source}>{source}</option>)}
      </select>
      {packs.map((name) => <button key={name} className={name === pack ? 'on' : ''} onClick={() => onPack(name)}>{name}</button>)}
      <button onClick={onOverview}>{overview ? 'single' : 'overview (all in pack)'}</button>
      <button onClick={onAdd}>+ add asset</button>
      <button onClick={onRotate}>rotate 90 (game rotation)</button>
    </div>
  )
}
