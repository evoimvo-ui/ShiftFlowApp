import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, CheckCircle, XCircle, Calendar, ArrowRightLeft, User } from 'lucide-react'
import { Modal, Btn } from './UI'
import { notificationApi } from '../api'

export default function NotificationModal({ open, onClose, notification, workers }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  if (!open || !notification) return null

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
      {renderContent()}
    </Modal>
  )
}
