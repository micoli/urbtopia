interface Props {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function CheckboxField({ label, checked, onChange }: Props) {
  return (
    <div className="row">
      {label}: <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </div>
  )
}
