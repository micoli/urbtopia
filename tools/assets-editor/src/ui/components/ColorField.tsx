import { useEffect, useRef } from 'react'

interface Props {
  value: string
  onCommit: (value: string) => void
}

// The native change event fires once the picker is closed, unlike React's onChange which fires while dragging.
export function ColorField({ value, onCommit }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const commit = useRef(onCommit)
  commit.current = onCommit

  useEffect(() => {
    const input = ref.current!
    const onChange = () => commit.current(input.value)
    input.addEventListener('change', onChange)
    return () => input.removeEventListener('change', onChange)
  }, [])

  return <input ref={ref} type="color" defaultValue={value} key={value} />
}
