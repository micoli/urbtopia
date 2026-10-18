type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const BUTTONS: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-indigo-300',
  secondary: 'bg-white text-zinc-800 ring-1 ring-zinc-300 hover:bg-zinc-50 disabled:text-zinc-400',
  ghost: 'text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900 disabled:text-zinc-300',
  danger: 'bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:text-red-300',
}

export const button = (variant: ButtonVariant = 'secondary') =>
  `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${BUTTONS[variant]}`

export const input =
  'w-full rounded-md border-0 bg-white px-2.5 py-1.5 text-sm text-zinc-900 ring-1 ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none read-only:bg-zinc-50 read-only:text-zinc-500'

type Tone = 'neutral' | 'red' | 'amber' | 'green' | 'indigo'

const TONES: Record<Tone, string> = {
  neutral: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
}

export const badge = (tone: Tone = 'neutral') => `inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${TONES[tone]}`

export const panel = 'rounded-lg bg-white ring-1 ring-zinc-200'

export const dialogOverlay = 'fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-[1px]'

export const dialogContent =
  'fixed top-1/2 left-1/2 z-50 flex w-[min(28rem,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-xl bg-white p-5 shadow-xl ring-1 ring-zinc-200'
