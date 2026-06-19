import React from 'react'
import { Modal, Btn } from './UI'

export default function ConsentModal({ isOpen, onAccept }) {
  const [loading, setLoading] = React.useState(false)
  const [hasAcceptedTos, setHasAcceptedTos] = React.useState(false)
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = React.useState(false)

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

  const isAcceptButtonDisabled = !hasAcceptedTos || !hasAcceptedPrivacy

  return (
    <Modal
      open={isOpen}
      title="Uvjeti korištenja i privatnost"
      width={600}
    >
      <div className="space-y-5">
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-4">
          Prije nego nastavite, molimo vas da pročitate i prihvatite naše uvjete.
        </p>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="acceptTos"
            checked={hasAcceptedTos}
            onChange={(e) => setHasAcceptedTos(e.target.checked)}
            className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
          />
          <label htmlFor="acceptTos" className="text-sm text-[var(--text-primary)]">
            Pročitao/la sam i prihvaćam <a href="https://ei-apps.com/tos" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Uvjete korištenja</a>
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="acceptPrivacy"
            checked={hasAcceptedPrivacy}
            onChange={(e) => setHasAcceptedPrivacy(e.target.checked)}
            className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
          />
          <label htmlFor="acceptPrivacy" className="text-sm text-[var(--text-primary)]">
            Pročitao/la sam i prihvaćam <a href="https://ei-apps.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Politiku privatnosti</a>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Btn
            variant="primary"
            onClick={handleAccept}
            disabled={loading || isAcceptButtonDisabled}
          >
            {loading ? 'Prihvaćam...' : 'Prihvaćam'}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
