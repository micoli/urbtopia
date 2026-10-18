import { PROFILE_COLORS, type Profile } from '../domain/profiles'
import { button } from './styles'
import { ProfileSwitcher } from './ProfileSwitcher'
import { ThemeSwitch } from './ThemeSwitch'

interface Props {
  profile: Profile
  onRefresh: () => void
}

export function TopBar({ profile, onRefresh }: Props) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 border-t-4 bg-white px-4 py-2.5" style={{ borderTopColor: PROFILE_COLORS[profile.color] }}>
      <div className="flex items-baseline gap-2">
        <h1 className="text-base font-semibold tracking-tight">Back office</h1>
        <span className="text-xs text-zinc-500">Urbtopia</span>
      </div>
      <ProfileSwitcher active={profile} />
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <ThemeSwitch />
        <button className={button('ghost')} onClick={onRefresh}>↻ Refresh</button>
      </div>
    </header>
  )
}
