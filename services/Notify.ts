import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function notify(title: string, body?: string) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      // data: null,
      autoDismiss: false,
      sticky: false,
      badge: 2,
    },
    trigger: { seconds: 5 },
  });
}
