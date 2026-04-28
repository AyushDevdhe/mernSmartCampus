const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");

//importing middlewares here
const { verifyJWT } = require("../middlewares/verifyJWT");

//importing controllers here
const {
  createQuery,
  getUserQueries,
  getAllQueries,
  assignQuery,
  updateStatus,
  updateQuery,
  deleteQuery,
  takeAdminAction,
  getEscalatedWarnings,
  getCriticalEscalations,
  getQueryById,
  reassignSupervisor,
  getActionHistory,
} = require("../controllers/queryController");

// POST routes with image upload
router.post("/create", verifyJWT, upload.single("image"), createQuery);
router.post("/reassign-supervisor", verifyJWT, reassignSupervisor);

// PUT routes with image upload
router.put("/assign/:queryId", verifyJWT, assignQuery);
router.put("/status/:queryId", verifyJWT, updateStatus);
router.put("/update/:queryId", verifyJWT, upload.single("image"), updateQuery);
router.put("/admin-action/:queryId", verifyJWT, takeAdminAction);

// DELETE routes
router.delete("/delete/:queryId", verifyJWT, deleteQuery);


router.get("/get-by-user", verifyJWT, getUserQueries);
router.get("/all", verifyJWT, getAllQueries);
router.get("/escalated-warnings", verifyJWT, getEscalatedWarnings);
router.get("/critical-escalations", verifyJWT, getCriticalEscalations);
router.get("/action-history", verifyJWT, getActionHistory);


router.get("/:queryId", verifyJWT, getQueryById);

module.exports = router;
