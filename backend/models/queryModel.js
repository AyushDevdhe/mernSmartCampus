const mongoose = require("mongoose");

const querySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      required: true,
      default: "Low",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Admin action fields
    adminAction: {
      type: String,
      enum: ["none", "warning", "penalty", "escalated"],
      default: "none",
    },
    adminActionMessage: {
      type: String,
      default: null,
    },
    actionTakenAt: {
      type: Date,
      default: null,
    },
    // NEW: Escalation tracking fields
    escalationLevel: {
      type: String,
      enum: ["none", "warning_24hr", "critical_48hr"],
      default: "none",
    },
    lastEscalationNotified: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Virtual populate for comments
querySchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "query",
});

// Ensure virtuals are included in JSON output
querySchema.set("toJSON", { virtuals: true });
querySchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Query", querySchema);
