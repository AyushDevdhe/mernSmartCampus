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
    <div
      className="notification-container"
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none",
          border: "none",
          fontSize: "20px",
          cursor: "pointer",
          position: "relative",
          padding: "8px",
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "0",
              right: "0",
              background: "#ef4444",
              color: "white",
              borderRadius: "50%",
              padding: "2px 6px",
              fontSize: "10px",
              fontWeight: "bold",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="notification-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            className="notification-dropdown"
            style={{
              position: "absolute",
              top: "40px",
              right: "0",
              width: "350px",
              maxHeight: "400px",
              background: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "16px" }}>Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#3b82f6",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div style={{ maxHeight: "350px", overflowY: "auto" }}>
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: "32px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #e2e8f0",
                      background: notification.isRead ? "white" : "#f0f9ff",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onClick={() =>
                      !notification.isRead && handleMarkAsRead(notification._id)
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "18px" }}>
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: "bold",
                            fontSize: "14px",
                            marginBottom: "4px",
                          }}
                        >
                          {notification.title}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#475569",
                            marginBottom: "4px",
                          }}
                        >
                          {notification.message}
                        </div>
                        <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                          {new Date(notification.createdAt).toLocaleString()}
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            background: "#3b82f6",
                            borderRadius: "50%",
                          }}
                        />
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
