import { useState } from 'react'
import { resetCityName, type AdminClient } from '../api/supabaseAdmin'
import { button } from './styles'
import { ConfirmDialog } from './ConfirmDialog'

interface Props {
  client: AdminClient
  userId: string
  cityId: string
  onlineName: string
  defaultName: string
  onChanged: () => void
}

export function CityNameReset({ client, userId, cityId, onlineName, defaultName, onChanged }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  if (onlineName === defaultName) return null

  const reset = async () => {
    setConfirming(false)
    setError('')
    try {
      await resetCityName(client, userId, cityId, defaultName)
      onChanged()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure))
    }
  }

  return (
    <>
      <button className={button('danger')} onClick={() => setConfirming(true)}>Reset name</button>
      {error && <span className="text-xs text-red-700" role="alert">{error}</span>}
      {confirming && (
        <ConfirmDialog
          title="Reset the City name"
          message={`Other players will read "${defaultName}" instead of "${onlineName}". The old name will not be published again.`}
          confirm="Reset name"
          onCancel={() => setConfirming(false)}
          onConfirm={() => void reset()}
        />
      )}
    </>
  )
}
