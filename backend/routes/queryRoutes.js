const express = require("express");
const router = express.Router();

//importing middlewares here
const { verifyJWT } = require("../middlewares/verifyJWT");

//importing controllers here
const { createQuery } = require("../controllers/queryController");

router.post("/create", verifyJWT, createQuery);

module.exports = router;
