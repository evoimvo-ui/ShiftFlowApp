import { useState, useEffect } from 'react'
import { notificationApi } from '../api'

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [currentNotification, setCurrentNotification] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!userId) {
      // Resetujemo stanje kada nema userId
      setNotifications([])
      setUnreadCount(0)
      setCurrentNotification(null)
      setModalOpen(false)
      return
    }

    const fetchNotifications = async () => {
      try {
        console.log('Debug - Fetching notifications for userId:', userId)
        const response = await notificationApi.getNotifications(userId)
        const notificationsData = response.data || []
        
        console.log('Debug - Notifications received:', notificationsData)
        setNotifications(notificationsData)
        setUnreadCount(notificationsData.filter(n => n.status === 'unread').length)
        
        // Ako ima novih nepročitanih notifikacija, prikaži prvu
        if (notificationsData.length > 0 && !modalOpen) {
          const firstUnread = notificationsData.find(n => n.status === 'unread')
          console.log('Debug - Modal open:', modalOpen, 'First unread:', firstUnread)
          if (firstUnread) {
            console.log('Debug - Showing notification modal for:', firstUnread)
            setCurrentNotification(firstUnread)
            setModalOpen(true)
          }
        }
      } catch (err) {
        console.error('Error fetching notifications:', err)
      }
    }

    // Inicijalno učitavanje
    fetchNotifications()

    // Polling svakih 10 sekundi samo ako je userId definisan
    const interval = setInterval(() => {
      if (userId) {
        fetchNotifications()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [userId, modalOpen])

  const markAsRead = async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId)
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId 
            ? { ...n, status: 'read', readAt: new Date() }
            : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    if (currentNotification) {
      markAsRead(currentNotification._id)
    }
    setCurrentNotification(null)
  }

  return {
    notifications,
    unreadCount,
    currentNotification,
    modalOpen,
    closeModal,
    markAsRead
  }
}
