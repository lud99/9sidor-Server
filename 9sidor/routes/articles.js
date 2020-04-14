const express = require("express");

// Get articles
const { 
    getArticlesInternal, 
    getArticlesDefault, 
    getArticlesPreview, 
    getArticlesList,

    getArticleFromUrl,
     
    addArticle,
    editArticle
} = require("../controllers/articles");

const router = express.Router();

// Get the articles with default formatting 
router.route("/").get(getArticlesDefault);

// Get the articles without custom formatting, straight from the database 
router.route("/internal").get(getArticlesInternal);
router.route("/internal/:subject").get(getArticlesInternal);

// Get the articles with default formatting 
router.route("/default").get(getArticlesDefault);
router.route("/default/:subject").get(getArticlesDefault);

// Get the articles with unnecessary information stripped out
router.route("/preview/").get(getArticlesPreview);
router.route("/preview/:subject").get(getArticlesPreview);

// Get the articles with only the very basic information
router.route("/list/").get(getArticlesList);
router.route("/list/:subject").get(getArticlesList);

// Get a article from its url
router.route("/url/").get(getArticleFromUrl);

// Add an article
router.route("/add").post(addArticle);

// Edit an article
router.route("/edit").patch(editArticle);

module.exports = router;