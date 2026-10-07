import { Checkbox, Label } from 'radix-ui'
import { useId } from 'react'

interface Props {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function CheckboxField({ label, checked, onChange }: Props) {
  const id = useId()
  return (
    <div className="row">
      <Label.Root htmlFor={id}>{label}: </Label.Root>
      <Checkbox.Root id={id} className="checkbox" checked={checked} onCheckedChange={(state) => onChange(state === true)}>
        <Checkbox.Indicator>✓</Checkbox.Indicator>
      </Checkbox.Root>
    </div>
  )
}
