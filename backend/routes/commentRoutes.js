const express = require("express");
const router = express.Router();

const { verifyJWT } = require("../middlewares/verifyJWT");

const {
  addComment,
  getCommentsByQuery,
  editComment,
  deleteComment,
} = require("../controllers/commentController");

// All routes require authentication
router.post("/:queryId", verifyJWT, addComment);
router.get("/:queryId", verifyJWT, getCommentsByQuery);
router.put("/:commentId", verifyJWT, editComment);
router.delete("/:commentId", verifyJWT, deleteComment);

module.exports = router;
