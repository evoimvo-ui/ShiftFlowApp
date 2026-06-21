// Push notifications hook - v2 
import { useState, useEffect } from 'react';
import { pushApi } from '../api';

export function usePushNotifications() {
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Provjeri inicijalni status
  useEffect(() => { 
    console.log('usePushNotifications useEffect running'); 
    console.log('Notification supported:', 'Notification' in window); 
    console.log('Permission status:', 'Notification' in window ? Notification.permission : 'not supported'); 
    if (!('Notification' in window)) return;

    setPermissionStatus(Notification.permission);

    if (Notification.permission === 'granted') {
      // Automatski registriraj subscription
      registerServiceWorker().then(registration => {
        registration.pushManager.getSubscription().then(existingSubscription => {
          if (existingSubscription) {
            // Već postoji, samo pošalji na backend u slučaju da nije sačuvan
            pushApi.subscribe(existingSubscription).catch(console.error);
            setIsSubscribed(true);
          } else {
            // Nema subscription, kreiraj novi
            requestPermission().catch(console.error);
          }
        });
      }).catch(console.error);
    }
  }, []);

  // Funkcija za registraciju Service Workera i dobijanje subscriptiona
  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications not supported');
    }

    // Registriraj Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    return registration;
  };

  // Funkcija za traženje dozvole i pretplatu
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    setLoading(true);
    try {
      // Traži dozvolu
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission !== 'granted') {
        throw new Error('Permission denied');
      }

      // Registriraj Service Worker
      const registration = await registerServiceWorker();

      // Dohvati VAPID javni ključ od servera (ili koristi hardkodirani)
      const vapidPublicKey = 'BF_g0ZxV0bdKAmcWXT_vemu58ZMXNadv_GfZtbAINZQf6xDxkdwI_LKD3F372PyMJWl--6o4W6ovJgExORxEqlQ';
      
      // Pomoćna funkcija za konverziju base64 u Uint8Array
      const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
      };

      // Dobij subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Pošalji subscription na server
      await pushApi.subscribe(subscription);
      setIsSubscribed(true);

      return { success: true };
    } catch (err) {
      console.error('Error requesting push permission:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Funkcija za odjavu
  const unsubscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          // Pošalji na server za brisanje
          await pushApi.unsubscribe({ endpoint: subscription.endpoint });
          await subscription.unsubscribe();
        }
      }
      setIsSubscribed(false);
      return { success: true };
    } catch (err) {
      console.error('Error unsubscribing push:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    permissionStatus,
    isSubscribed,
    loading,
    requestPermission,
    unsubscribe
  };
}