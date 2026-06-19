import React from 'react'
import { Modal } from './UI'

export default function UpgradeModal({ isOpen, errorCode, organizationId, onClose }) {
  const plans = [
    { id: 'basic', name: 'Basic', price: 'EUR 19.99', priceId: import.meta.env.VITE_PADDLE_BASIC_PRICE_ID },
    { id: 'premium', name: 'Premium', price: 'EUR 49.99', priceId: import.meta.env.VITE_PADDLE_PREMIUM_PRICE_ID },
    { id: 'business', name: 'Business', price: 'EUR 99.99', priceId: import.meta.env.VITE_PADDLE_BUSINESS_PRICE_ID }
  ]

  const getTitle = () => {
    switch (errorCode) {
      case 'trial_expired': return 'Vas trial period je istekao'
      case 'past_due': return 'Problem sa placanjem'
      case 'canceled': return 'Pretplata je otkazana'
      case 'paused': return 'Pretplata je pauzirana'
      default: return 'Potrebna je pretplata'
    }
  }

  const handleCheckout = (priceId) => {
    if (!window.Paddle) { console.error('Paddle nije inicijaliziran'); return; }
    window.Paddle.Checkout.open({ items: [{ priceId: priceId, quantity: 1 }], customData: { organization_id: organizationId } });
  }

  const isContactSupport = errorCode === 'past_due' || errorCode === 'paused'

  return (
    <Modal open={isOpen} onClose={onClose} title={getTitle()}>
      <div className="space-y-6">
        {isContactSupport ? (
          <div className="text-center space-y-4">
            <p className="text-[--text-muted]">Molimo kontaktirajte podrsku na email:</p>
            <a href="mailto:info@ei-apps.com" className="text-lg font-bold text-[--blue] hover:text-[--blue-bright]">info@ei-apps.com</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <button key={plan.id} onClick={() => handleCheckout(plan.priceId)} className="p-6 bg-[--bg-card] border border-[--border] rounded-2xl hover:border-[--blue] transition-all group">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-[--text-primary] group-hover:text-[--blue]">{plan.name}</h3>
                  <div className="text-3xl font-black text-[--blue]">{plan.price}</div>
                  <p className="text-[--text-muted] text-sm">po mjesecu</p>
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="pt-4 border-t border-[--border] flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-[--text-muted] hover:text-[--text-primary] transition-colors">Zatvori</button>
        </div>
      </div>
    </Modal>
  )
}