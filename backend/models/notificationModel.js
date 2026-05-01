const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "escalation_24hr",
        "escalation_48hr",
        "admin_action",
        "query_assigned",
        "query_resolved",
        "query_comment",
        "spam_marked",
        "query_spam",
        "student_blocked",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedQuery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Query",
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Notification", notificationSchema);
