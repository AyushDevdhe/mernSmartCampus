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
  getQueryById, // ADD THIS
} = require("../controllers/queryController");

router.post("/create", verifyJWT, createQuery);
router.get("/get-by-user", verifyJWT, getUserQueries);
router.get("/all", verifyJWT, getAllQueries);
router.put("/assign/:queryId", verifyJWT, assignQuery);
router.put("/status/:queryId", verifyJWT, updateStatus);
router.put("/update/:queryId", verifyJWT, updateQuery);
router.delete("/delete/:queryId", verifyJWT, deleteQuery);
router.put("/admin-action/:queryId", verifyJWT, takeAdminAction);

// NEW ESCALATION ROUTES
router.get("/escalated-warnings", verifyJWT, getEscalatedWarnings);
router.get("/critical-escalations", verifyJWT, getCriticalEscalations);
router.get("/:queryId", verifyJWT, getQueryById);

module.exports = router;
