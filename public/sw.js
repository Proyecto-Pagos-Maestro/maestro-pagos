self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Notificación', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Maestro Pagos';
  const options = {
    body: data.body || 'Recordatorio de pago',
    icon: '/favicon.ico',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
