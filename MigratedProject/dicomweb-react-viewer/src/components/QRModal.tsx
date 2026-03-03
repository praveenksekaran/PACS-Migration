import { useUIStore } from '../store/uiStore'
import { useQRStore } from '../store/qrStore'
import type { SearchField } from '../types/dicom'

export default function QRModal() {
  const isOpen = useUIStore((s) => s.isQROpen)
  const closeQR = useUIStore((s) => s.closeQR)

  const { searchField, searchText, results, setSearchField, setSearchText, toggleSelect,
          search, loadSelected, loadAll } = useQRStore()

  if (!isOpen) return null

  async function handleGetSelected() {
    await loadSelected()
    closeQR()
  }

  async function handleGetAll() {
    await loadAll()
    closeQR()
  }

  return (
    <div data-testid="qr-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: 24, minWidth: 700, borderRadius: 4 }}>
        <h2 style={{ margin: '0 0 16px' }}>Query / Retrieve</h2>

        {/* Search row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <select
            data-testid="qr-field-select"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value as SearchField)}
          >
            <option value="patientName">Patient Name</option>
            <option value="patientId">Patient ID</option>
          </select>
          <input
            data-testid="qr-search-input"
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search…"
            style={{ flex: 1 }}
          />
          <button data-testid="qr-find-btn" onClick={() => search()}>
            Find
          </button>
        </div>

        {/* Results table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr>
              <th></th>
              <th>Patient Name</th>
              <th>Patient ID</th>
              <th>Study UID</th>
              <th>Modality</th>
              <th>Body Part</th>
              <th>Series UID</th>
              <th>Series Description</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.seriesUid}>
                <td>
                  <input
                    type="checkbox"
                    data-testid={`qr-row-check-${r.seriesUid}`}
                    checked={r.selected}
                    onChange={() => toggleSelect(r.seriesUid)}
                  />
                </td>
                <td>{r.patientName}</td>
                <td>{r.patientId}</td>
                <td>{r.studyUid}</td>
                <td>{r.modality}</td>
                <td>{r.bodyPart}</td>
                <td>{r.seriesUid}</td>
                <td>{r.seriesDescription}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button data-testid="qr-get-selected-btn" onClick={handleGetSelected}>
            Get Selected
          </button>
          <button data-testid="qr-get-all-btn" onClick={handleGetAll}>
            Get All
          </button>
          <button data-testid="qr-cancel-btn" onClick={closeQR}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
