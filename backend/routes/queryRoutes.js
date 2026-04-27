const express = require("express");
const router = express.Router();

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

// POST routes
router.post("/create", verifyJWT, createQuery);
router.post("/reassign-supervisor", verifyJWT, reassignSupervisor);

// PUT routes
router.put("/assign/:queryId", verifyJWT, assignQuery);
router.put("/status/:queryId", verifyJWT, updateStatus);
router.put("/update/:queryId", verifyJWT, updateQuery);
router.put("/admin-action/:queryId", verifyJWT, takeAdminAction);

// DELETE routes
router.delete("/delete/:queryId", verifyJWT, deleteQuery);

// GET routes - SPECIFIC routes FIRST (must come before dynamic routes)
router.get("/get-by-user", verifyJWT, getUserQueries);
router.get("/all", verifyJWT, getAllQueries);
router.get("/escalated-warnings", verifyJWT, getEscalatedWarnings);
router.get("/critical-escalations", verifyJWT, getCriticalEscalations);
router.get("/action-history", verifyJWT, getActionHistory);

// DYNAMIC route - MUST BE LAST
router.get("/:queryId", verifyJWT, getQueryById);

module.exports = router;
