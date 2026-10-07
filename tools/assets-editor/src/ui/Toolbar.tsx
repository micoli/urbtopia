import { Toolbar as RadixToolbar } from 'radix-ui'

interface Props {
  overview: boolean
  onOverviewChange: (overview: boolean) => void
  onAdd: () => void
  onPlusRotate: () => void
  onMinusRotate: () => void
}

export function Toolbar({ overview, onOverviewChange, onAdd, onPlusRotate, onMinusRotate }: Props) {
  return (
    <RadixToolbar.Root id="bar" aria-label="Assets">
      World:
      <RadixToolbar.Button className="toolbar-button" onClick={onMinusRotate}>-90°</RadixToolbar.Button>
      <RadixToolbar.Button className="toolbar-button" onClick={onPlusRotate}>+90°</RadixToolbar.Button>
      <RadixToolbar.ToolbarSeparator/>
      <RadixToolbar.ToggleGroup type="single" value={overview ? 'overview' : 'single'} onValueChange={(value) => value && onOverviewChange(value === 'overview')} aria-label="View">
        <RadixToolbar.ToggleItem className="toolbar-button" value="single">single</RadixToolbar.ToggleItem>
        <RadixToolbar.ToggleItem className="toolbar-button" value="overview">overview (all in pack)</RadixToolbar.ToggleItem>
      </RadixToolbar.ToggleGroup>
      <RadixToolbar.ToolbarSeparator/>
      <RadixToolbar.Button className="toolbar-button" onClick={onAdd}>+ add asset</RadixToolbar.Button>
    </RadixToolbar.Root>
  )
}
