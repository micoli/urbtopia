import { PROFILE_COLORS, type ProfileColor } from '../domain/profiles'

interface Props {
  value: ProfileColor
  onChange: (color: ProfileColor) => void
}

export function ColorPicker({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Color" className="flex gap-2">
      {(Object.keys(PROFILE_COLORS) as ProfileColor[]).map(color => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={color}
          title={color}
          onClick={() => onChange(color)}
          className={`size-6 rounded-full ring-offset-2 ring-offset-white transition ${value === color ? 'ring-2 ring-zinc-900' : 'hover:scale-110'}`}
          style={{ backgroundColor: PROFILE_COLORS[color] }}
        />
      ))}
    </div>
  )
}
