import React from 'react'
import { Modal, Btn } from './UI'

export default function ConsentModal({ isOpen, onAccept }) {
  const [loading, setLoading] = React.useState(false)

  const handleAccept = async () => {
    setLoading(true)
    try {
      await onAccept()
    } catch (err) {
      console.error('Consent error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={isOpen}
      title="Uvjeti korištenja i privatnost"
      width={600}
    >
      <div className="space-y-5">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 max-h-64 overflow-y-auto">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Uvjeti korištenja</h3>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-4">
            Korištenjem ove aplikacije slažete se s našim uvjetima korištenja.
          </p>
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Politika privatnosti</h3>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            Vaši podaci su sigurni i koriste se samo za funkcioniranje aplikacije.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Btn
            variant="primary"
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? 'Prihvaćam...' : 'Prihvaćam'}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
