const express = require("express");

// Routes
const { clearCache } = require("../controllers/debug");

const router = express.Router();

router.route("/cache/clear").post(clearCache)

module.exports = router;