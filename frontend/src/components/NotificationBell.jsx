import { useEffect, useState } from "react";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/NotificationApis";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await getUserNotifications();
      if (res?.data?.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "escalation_24hr":
        return "⚠️";
      case "escalation_48hr":
        return "🚨";
      case "admin_action":
        return "👑";
      case "query_assigned":
        return "📋";
      case "query_resolved":
        return "✅";
      default:
        return "🔔";
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-xl border border-slate-300 bg-white p-2 text-xl transition hover:bg-slate-100"
        aria-label="Toggle notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 inline-flex min-w-5 -translate-y-1 translate-x-1 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[998]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-12 z-[999] w-[350px] max-w-[92vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-medium text-sky-700 transition hover:text-sky-800"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[350px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`cursor-pointer border-b border-slate-200 px-4 py-3 transition hover:bg-slate-50 ${
                      notification.isRead ? "bg-white" : "bg-sky-50"
                    }`}
                    onClick={() =>
                      !notification.isRead && handleMarkAsRead(notification._id)
                    }
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1">
                        <div className="mb-0.5 text-sm font-semibold text-slate-800">
                          {notification.title}
                        </div>
                        <div className="mb-1 text-xs text-slate-600">
                          {notification.message}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(notification.createdAt).toLocaleString()}
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
