import { useEffect, useRef } from 'react'

interface Props {
  name: string
  selected: boolean
  defined: boolean
  usedInGame: boolean
  onSelect: () => void
}

export function AssetRow({ name, selected, defined, usedInGame, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  return (
      <div
          ref={ref}
          role="treeitem"
          aria-selected={selected}
          className={`asset-row${selected ? ' sel' : ''}${defined ? ' done' : ''}`}
          onClick={onSelect}
      >
        <span>{usedInGame && <span title={"used in game"}>(*) </span>}{name}</span>
        {defined ? 'defined' : ''}
      </div>
  )
}
