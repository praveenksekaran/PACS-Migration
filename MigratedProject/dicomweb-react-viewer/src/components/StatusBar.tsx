import { useStatusStore } from '../store/statusStore'

export default function StatusBar() {
  const message = useStatusStore((s) => s.message)
  return <div data-testid="status-bar">{message}</div>
}
