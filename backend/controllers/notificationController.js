const notificationModel = require("../models/notificationModel");
const userModel = require("../models/userModel");
const mailSender = require("../utils/mailSender");

// Create a notification
exports.createNotification = async (
  recipientId,
  type,
  title,
  message,
  relatedQueryId = null,
) => {
  try {
    const notification = await notificationModel.create({
      recipient: recipientId,
      type,
      title,
      message,
      relatedQuery: relatedQueryId,
    });

    // Get user email for sending email notification
    const user = await userModel.findById(recipientId);
    if (user && user.email) {
      try {
        await mailSender(
          user.email,
          `SmartCampus: ${title}`,
          `<div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>${title}</h2>
            <p>${message}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">Login to your dashboard to take action.</p>
          </div>`,
        );
        notification.emailSent = true;
        await notification.save();
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
    }

    return notification;
  } catch (err) {
    console.error("Error creating notification:", err);
    return null;
  }
};

// Get all notifications for logged-in user
exports.getUserNotifications = async (req, res) => {
  try {
    const { id } = req.user;

    const notifications = await notificationModel
      .find({ recipient: id })
      .populate("relatedQuery", "title status")
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await notificationModel.countDocuments({
      recipient: id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error("Get Notifications Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: err.message,
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { id } = req.user;

    const notification = await notificationModel.findOneAndUpdate(
      { _id: notificationId, recipient: id },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (err) {
    console.error("Mark as Read Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error marking notification as read",
      error: err.message,
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const { id } = req.user;

    await notificationModel.updateMany(
      { recipient: id, isRead: false },
      { isRead: true },
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (err) {
    console.error("Mark All as Read Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error marking all as read",
      error: err.message,
    });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { id } = req.user;

    const result = await notificationModel.findOneAndDelete({
      _id: notificationId,
      recipient: id,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (err) {
    console.error("Delete Notification Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error deleting notification",
      error: err.message,
    });
  }
};
