export default function Shell() {
  return (
    <div data-testid="shell">
      <div data-testid="menu-bar" />
      <div data-testid="toolbar" />
      <div style={{ display: 'flex', flex: 1 }}>
        <div data-testid="study-tree" />
        <div data-testid="viewer-canvas" style={{ flex: 1 }} />
      </div>
      <div data-testid="status-bar" />
    </div>
  )
}
