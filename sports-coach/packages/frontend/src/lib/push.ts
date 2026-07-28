import { api, ApiError } from "./api";

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window;
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const bytes = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function getPushSubscriptionState(): Promise<"unsupported" | "subscribed" | "unsubscribed"> {
  if (!isPushSupported()) return "unsupported";
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return "unsubscribed";
  const subscription = await registration.pushManager.getSubscription();
  return subscription ? "subscribed" : "unsubscribed";
}

export async function enablePushNotifications(): Promise<void> {
  if (!isPushSupported()) {
    throw new Error("Les notifications push ne sont pas supportees par ce navigateur.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permission de notification refusee.");
  }

  const { publicKey } = await api.getVapidPublicKey();
  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const json = subscription.toJSON();
  await api.subscribeToPush({
    endpoint: json.endpoint!,
    keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
  });
}

export async function disablePushNotifications(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  await subscription.unsubscribe();
  try {
    await api.unsubscribeFromPush(subscription.endpoint);
  } catch (err) {
    if (!(err instanceof ApiError)) throw err;
  }
}
