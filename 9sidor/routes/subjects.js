const express = require("express");

// Routes
const { getSubjectsDefault, addSubject } = require("../controllers/subjects");

const router = express.Router();

router.route("/default").get(getSubjectsDefault)
router.route("/add").post(addSubject);

module.exports = router;