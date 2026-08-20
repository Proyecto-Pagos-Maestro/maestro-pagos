function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function activarNotificaciones() {
  console.log("1. Verificando soporte del navegador...");
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.error("Este navegador no soporta service workers o push.");
    return;
  }

  console.log("2. Registrando service worker...");
  const registration = await navigator.serviceWorker.register("/sw.js");
  console.log("Service worker registrado:", registration);

  console.log("3. Pidiendo permiso...");
  const permission = await Notification.requestPermission();
  console.log("Permiso:", permission);
  if (permission !== "granted") {
    console.error("Permiso no otorgado");
    return;
  }

  console.log("4. Suscribiendo al push manager...");
  const VAPID_PUBLIC_KEY = "BATmHpFeKc6olmt2yZPyjT_OS-sKlGTLDHG3qtfGXuQyOGOrc7ZiEatAUAfFKGHMgdH_-pVPwEIpdn_fOSfNLFs";
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  console.log("Suscripción generada:", subscription);

  console.log("5. Enviando al backend...");
  const res = await fetch("http://localhost:3001/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
  console.log("Respuesta del backend:", res.status, await res.text());
}
