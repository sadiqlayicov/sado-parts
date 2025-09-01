// Store pending notifications in memory (in production, use Redis or database)
let pendingNotifications: any[] = [];

// Function to add notification (called from other API endpoints)
export function addNotification(type: string, message: string, data?: any) {
  const notification = {
    type,
    message,
    data,
    time: new Date().toISOString(),
    createdAt: new Date()
  };

  pendingNotifications.push(notification);

  // Keep only last 100 notifications
  if (pendingNotifications.length > 100) {
    pendingNotifications = pendingNotifications.slice(-100);
  }
}

// Function to get notifications
export function getNotifications() {
  return [...pendingNotifications];
}

// Function to clear notifications
export function clearNotifications() {
  pendingNotifications = [];
}
