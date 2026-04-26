const express = require("express");
const router = express.Router();

const { verifyJWT } = require("../middlewares/verifyJWT");

const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

router.get("/", verifyJWT, getUserNotifications);
router.put("/read/:notificationId", verifyJWT, markAsRead);
router.put("/read-all", verifyJWT, markAllAsRead);
router.delete("/:notificationId", verifyJWT, deleteNotification);

module.exports = router;
