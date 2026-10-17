import { Switch } from 'radix-ui'

interface Props {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function SwitchControl({ checked, label, onChange, disabled }: Props) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      aria-label={label}
      className="relative mt-1 h-5 w-9 rounded-full bg-zinc-300 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-indigo-600"
    >
      <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[18px]" />
    </Switch.Root>
  )
}
