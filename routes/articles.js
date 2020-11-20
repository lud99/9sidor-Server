const express = require("express");

// Get articles
const { 
    getArticlesDefault, 
    getArticlesList,

    getArticleFromUrl,
     
    addArticle,
    editArticle,
    deleteArticle,
    deleteAllArticles,

    tweetArticle,
    sendArticleDiscord
} = require("../controllers/articles");

const router = express.Router();

// Get the articles with default formatting 
router.route("/").get(getArticlesDefault);

// Get the articles with default formatting 
router.route("/default").get(getArticlesDefault);
router.route("/default/:subject").get(getArticlesDefault);

// Get the articles with only the very basic information
router.route("/list/").get(getArticlesList);
router.route("/list/:subject").get(getArticlesList);

// Get a article from its url
router.route("/url/").get(getArticleFromUrl);

// Add an article
router.route("/add").post(addArticle);

// Edit an article
router.route("/edit").patch(editArticle);

// Detete an article
router.route("/delete").delete(deleteArticle);

// Detete all articles
router.route("/delete-all").delete(deleteAllArticles);

// Social media
router.route("/tweet/:id").post(tweetArticle);
router.route("/discord/:id").post(sendArticleDiscord);

module.exports = router;