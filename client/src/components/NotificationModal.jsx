import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, CheckCircle, XCircle, Calendar, ArrowRightLeft, User, Bell } from 'lucide-react'
import { Modal, Btn } from './UI'
import { notificationApi } from '../api'

export default function NotificationModal({ open, onClose, notification, workers, permissionStatus, requestPermission, hasSubscription }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  // Provjeri je li banner već prikazan
  useEffect(() => {
    if (open && !bannerDismissed) {
      // Prikazujemo banner samo kada je prvi put otvoren i permission je default
      setBannerDismissed(false)
    }
  }, [open, bannerDismissed])

  const handleEnablePush = async () => {
    try {
      await requestPermission()
      setBannerDismissed(true)
    } catch (err) {
      console.error('Error enabling push:', err)
    }
  }

  if (!open) return null

  const handleAction = async (action) => {
    setLoading(true)
    try {
      await notificationApi.processNotification(notification._id, action)
      onClose()
    } catch (err) {
      console.error('Error processing notification:', err)
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    switch (notification.type) {
      case 'swap_request':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <ArrowRightLeft size={24} />
              <span className="text-sm font-semibold">{t('notifications.swapRequest')}</span>
            </div>
            <p className="text-[--text-secondary]">{notification.message}</p>
            <div className="flex gap-3 justify-end pt-2">
              <Btn 
                variant="danger" 
                onClick={() => handleAction('reject')}
                disabled={loading}
                icon={<XCircle size={16} />}
              >
                {t('notifications.reject')}
              </Btn>
              <Btn 
                variant="success" 
                onClick={() => handleAction('approve')}
                disabled={loading}
                icon={<CheckCircle size={16} />}
              >
                {t('notifications.accept')}
              </Btn>
            </div>
          </div>
        )

      case 'swap_approval':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-cyan-400">
              <User size={24} />
              <span className="text-sm font-semibold">{t('notifications.swapApproval')}</span>
            </div>
            <p className="text-[--text-secondary]">{notification.message}</p>
            <div className="flex gap-3 justify-end pt-2">
              <Btn 
                variant="danger" 
                onClick={() => handleAction('reject')}
                disabled={loading}
                icon={<XCircle size={16} />}
              >
                {t('notifications.reject')}
              </Btn>
              <Btn 
                variant="success" 
                onClick={() => handleAction('approve')}
                disabled={loading}
                icon={<CheckCircle size={16} />}
              >
                {t('notifications.approve')}
              </Btn>
            </div>
          </div>
        )

      case 'absence_request':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Calendar size={24} />
              <span className="text-sm font-semibold">{t('notifications.absenceRequest')}</span>
            </div>
            <p className="text-[--text-secondary]">{notification.message}</p>
            <div className="flex gap-3 justify-end pt-2">
              <Btn 
                variant="danger" 
                onClick={() => handleAction('reject')}
                disabled={loading}
                icon={<XCircle size={16} />}
              >
                {t('notifications.reject')}
              </Btn>
              <Btn 
                variant="success" 
                onClick={() => handleAction('approve')}
                disabled={loading}
                icon={<CheckCircle size={16} />}
              >
                {t('notifications.approve')}
              </Btn>
            </div>
          </div>
        )

      case 'swap_response':
      case 'absence_response':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle size={24} />
              <span className="text-sm font-semibold">{notification.title}</span>
            </div>
            <p className="text-[--text-secondary]">{notification.message}</p>
            <div className="flex justify-end pt-2">
              <Btn onClick={onClose} disabled={loading}>
                {t('common.ok')}
              </Btn>
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <p className="text-[--text-secondary]">{notification.message}</p>
            <div className="flex justify-end pt-2">
              <Btn onClick={onClose} disabled={loading}>
                {t('common.ok')}
              </Btn>
            </div>
          </div>
        )
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('notifications.title')} width={500}>
      {permissionStatus === 'default' && !bannerDismissed && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-3">
          <Bell size={18} className="text-blue-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-[--text-secondary]">Omogućite push notifikacije da budete obavješteni čak i kada niste u aplikaciji.</p>
          </div>
          <Btn variant="primary" size="sm" onClick={handleEnablePush}>
            Omogući
          </Btn>
        </div>
      )}

      {permissionStatus === 'denied' && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <Bell size={18} className="text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-[--text-secondary]">Push notifikacije su blokirane. Omogućite ih u postavkama browsera.</p>
          </div>
        </div>
      )}

      {permissionStatus === 'granted' && !hasSubscription && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3">
          <Bell size={18} className="text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-[--text-secondary]">Notifikacije su dozvoljene, ali uređaj nije povezan za push obavijesti.</p>
          </div>
          <Btn variant="primary" size="sm" onClick={handleEnablePush}>
            Aktiviraj
          </Btn>
        </div>
      )}
      
      {/* If no notification, show empty state */}
      {!notification ? (
        <div className="py-12 text-center">
          <Bell size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{t('notifications.title')}</h3>
          <p className="text-sm text-[var(--text-secondary)]">{t('notifications.noNotifications') || 'Nema novih notifikacija.'}</p>
        </div>
      ) : (
        renderContent()
      )}
    </Modal>
  )
}
