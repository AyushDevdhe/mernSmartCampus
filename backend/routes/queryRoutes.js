const express = require("express");
const router = express.Router();

//importing middlewares here
const { verifyJWT } = require("../middlewares/verifyJWT");

//importing controllers here
const {
  createQuery,
  getUserQueries,
} = require("../controllers/queryController");

router.post("/create", verifyJWT, createQuery);
router.get("/get-by-user", verifyJWT, getUserQueries);

module.exports = router;
