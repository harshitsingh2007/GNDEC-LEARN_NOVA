export const notificationsSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getPermission = (): NotificationPermission | 'unsupported' => {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission;
};

export const requestPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
};

export const canNotify = (): boolean => {
  return notificationsSupported() && Notification.permission === 'granted';
};

export const sendNotification = (title: string, options?: NotificationOptions): void => {
  if (!notificationsSupported()) return;
  if (Notification.permission !== 'granted') return;
  // eslint-disable-next-line no-new
  new Notification(title, options);
};

export const iconUrl = (): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
  return link?.href;
};

