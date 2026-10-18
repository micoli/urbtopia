import { PROFILE_COLORS, type ProfileColor } from '../domain/profiles'

interface Props {
  color: ProfileColor
}

export function ColorDot({ color }: Props) {
  return <span aria-hidden className="inline-block size-2.5 shrink-0 rounded-full" style={{ backgroundColor: PROFILE_COLORS[color] }} />
}
