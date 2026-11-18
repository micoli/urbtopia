import type { Dashboard } from '../domain/dashboard'
import { formatBytes } from '../domain/format'
import { BarList } from './BarList'
import { BucketChart } from './BucketChart'
import { CrossTable } from './CrossTable'
import { DashboardCard } from './DashboardCard'
import { RangeBars } from './RangeBars'
import { UnbuiltList } from './UnbuiltList'

interface Props {
  dashboard: Dashboard
}

export function DashboardBody({ dashboard }: Props) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <DashboardCard title="Accounts"><BucketChart buckets={dashboard.activity.accountKind} label="Accounts" form="share" /></DashboardCard>
        <DashboardCard title="Activity" note="Date of the latest save of each user."><BucketChart buckets={dashboard.activity.recency} label="Activity" form="ordered" /></DashboardCard>
        <DashboardCard title="Cities per user"><BucketChart buckets={dashboard.activity.cities} label="Cities per user" form="ordered" /></DashboardCard>
        <DashboardCard title="Citizens" note="Readable saves only."><BucketChart buckets={dashboard.progression.citizens} label="Citizens" form="ordered" /></DashboardCard>
        <DashboardCard title="Size of the cities" note="Readable saves only."><RangeBars rows={dashboard.progression.spreads} /></DashboardCard>
        <DashboardCard title="Tutorial" note="The step each player stopped at."><BucketChart buckets={dashboard.progression.tutorial} label="Tutorial" form="funnel" /></DashboardCard>
        <DashboardCard title="Difficulty"><BucketChart buckets={dashboard.settings.difficulty} label="Difficulty" form="share" /></DashboardCard>
        <DashboardCard title="Politics"><BucketChart buckets={dashboard.settings.politics} label="Politics" form="share" /></DashboardCard>
        <DashboardCard title="Challenge"><BucketChart buckets={dashboard.settings.challenge} label="Challenge" form="share" /></DashboardCard>
        <DashboardCard title="Save format version" note="An old version means the player has not come back since."><BucketChart buckets={dashboard.settings.formatVersion} label="Save format version" form="ordered" /></DashboardCard>
        <DashboardCard title="Readability"><BucketChart buckets={dashboard.health.readability} label="Readability" form="share" /></DashboardCard>
        <DashboardCard title="Preferences in the save"><BucketChart buckets={dashboard.health.prefsCoverage} label="Preferences in the save" form="share" /></DashboardCard>
        <DashboardCard title="Size of the saves" note={`Against the 1 MB limit. Largest: ${formatBytes(dashboard.health.largestSize)}.`}><BucketChart buckets={dashboard.health.size} label="Size of the saves" form="ordered" /></DashboardCard>
      </div>
      <h2 className="mt-5 mb-2 text-sm font-semibold text-zinc-800">Content</h2>
      <p className="mb-2 text-xs text-zinc-500">{dashboard.content.cities} cities: the latest save of each City made in the period, readable by this game version. A percentage is a share of those cities.</p>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <DashboardCard title="Most built buildings" note="Cities with at least one."><BarList buckets={dashboard.content.topTypes} total={dashboard.content.cities} /></DashboardCard>
        <DashboardCard title="Buildings by kind" note="Cities with at least one building of the kind."><BarList buckets={dashboard.content.byKind} total={dashboard.content.cities} /></DashboardCard>
        {dashboard.content.features.map(group => (
          <DashboardCard key={group.group} title={group.group}><BarList buckets={group.items} total={dashboard.content.cities} /></DashboardCard>
        ))}
        <DashboardCard title="Never built" note="Buildings that no city of the period has, by kind."><UnbuiltList kinds={dashboard.content.unbuilt} /></DashboardCard>
      </div>
      <h2 className="mt-5 mb-2 text-sm font-semibold text-zinc-800">Preferences</h2>
      <p className="mb-2 text-xs text-zinc-500">One card per key found in the saves, values as saved.</p>
      <div className="mb-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
        {dashboard.crossings.map(crossing => (
          <DashboardCard key={crossing.title} title={crossing.title} note="Users, from their latest save."><CrossTable table={crossing.table} /></DashboardCard>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {dashboard.prefs.map(pref => (
          <DashboardCard key={pref.key} title={pref.key}><BucketChart buckets={pref.values} label={pref.key} form="share" /></DashboardCard>
        ))}
        {dashboard.prefs.length === 0 && <p className="text-sm text-zinc-500">No save holds preferences yet.</p>}
      </div>
    </>
  )
}
