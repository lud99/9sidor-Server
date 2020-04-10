const express = require("express");
const { getAllWords, addWord, searchWord, updateWords } = require("../controllers/words");

const router = express.Router();

router.route("/").post(addWord);
router.route("/all").get(getAllWords);
router.route("/search").get(searchWord);
router.route("/update").post(updateWords);

module.exports = router;