import { newProfile } from '../domain/profiles'
import { useProfiles } from '../store/connectionStore'
import { ProfileForm } from './ProfileForm'
import { panel } from './styles'

export function ConnectionScreen() {
  const save = useProfiles(state => state.save)

  return (
    <main className="grid min-h-full place-items-center p-6">
      <div className={`${panel} flex w-[min(30rem,100%)] flex-col gap-4 p-6 shadow-sm`}>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Urbtopia Back office</h1>
          <p className="text-sm text-zinc-500">Add a Supabase project. You can add more and switch between them later.</p>
        </div>
        <ProfileForm initial={newProfile(crypto.randomUUID())} submitLabel="Connect" onSubmit={save} />
      </div>
    </main>
  )
}
