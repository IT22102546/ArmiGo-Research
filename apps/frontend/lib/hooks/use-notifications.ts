// Re-export everything from the notifications context
// This file is kept for backward compatibility - all components importing from here will continue to work
export {
  useNotifications,
  NotificationsProvider,
  getDeliveryStatus,
  type Notification,
  type NotificationDeliveryStatus,
} from "./notifications-context";
