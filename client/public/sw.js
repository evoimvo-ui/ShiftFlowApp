self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'ShiftForge';
  const options = {
    body: data.body,
    icon: data.icon || '/SFicon-512.png',
    badge: data.badge || '/SFicon-512.png',
    data: data.data || {}
  };
  
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Otvori ili fokusiraj aplikaciju
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Ako postoji već otvoren tab, fokusiraj prvi dostupni
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Inače otvori novi tab
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});