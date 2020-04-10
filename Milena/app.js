
const express = require("express");
const app = express();

const cors = require("cors");

const request = require("request");

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

app.use(cors());

app.get("/api/v1/articles", (req, res) => {
    const page = req.query.page || 1;
    const commentAuthor = req.query.commentAuthor || "";
    const searchExact = req.query.searchExact == "true" || false;

    console.log("Sending articles for page", page);

    getArticles({ page, commentAuthor, searchExact }, (error, articles) => {
        if (error) return res.status(500).json({ success: false });

        res.send({ success: true, data: articles });
    });
});

const getArticles = ({ page, commentAuthor, searchExact }, callback) => {
    get(`https://8sidor.se/${page > 1 ? `page/${page}/` : ""}?s=`, (error, body) => {
        const dom = new JSDOM(body);

        dom.$ = (query) => (dom.window.document.querySelector(query) || {});
        dom.$All = (query) => (dom.window.document.querySelectorAll(query) || {});

        const urls = [];
        dom.$All(".blog-main .article h2 a").forEach(a => urls.push(a.href));

        const articles = [];
        urls.forEach(url => getArticle({ url, commentAuthor, searchExact }, (error, article) => {
            articles.push(article);

            if (articles.length == 10)
                callback(error, articles);
        }));
    });
};

const getArticle = ({ url, commentAuthor, searchExact }, callback) => {
    get(url, (error, body) => {
        const dom = new JSDOM(body);

        dom.$ = (query) => (dom.window.document.querySelector(query) || {});

        const article = {
            url: url,
            subject: dom.$(".article.article-large .category-header").textContent,
            subjectColor: dom.$(".article.article-large .category-header").style.backgroundColor,
            imageSrc: dom.$(".article.article-large img.size-large").src,
            imageText: dom.$(".article.article-large .image-text").textContent,
            title: dom.$(".article.article-large h2").textContent,
            date: dom.$("p.date").textContent,
            comments: findCommentsByAuthor(dom, commentAuthor, searchExact)
        }

        callback(error, article);
    });
}

const findCommentsByAuthor = (dom, authorName, searchExact) => {
    const allCommentAuthors = dom.window.document.querySelectorAll("cite.fn");

    const comments = [];
    allCommentAuthors.forEach(author => {
        const comment = author.parentNode.parentNode;

        // Check if the author is exactly the same
        if (searchExact) {
            if (author.textContent.toLowerCase().replaceAll(" ") == authorName.toLowerCase().replaceAll(" "))
                comments.push(comment.outerHTML);
        } else { // Check if the specified name is somewhere in the author name
            if (author.textContent.toLowerCase().replaceAll(" ").includes(authorName.toLowerCase().replaceAll(" ")))
                comments.push(comment.outerHTML);
        }
    });

    return comments;
}

const get = (url, callback) => {
    const options = {
        url: url,
        headers: {
            'User-Agent': "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36"
        }
    };

    request.get(options, (error, response, body) => callback(error, body, response));
}

String.prototype.replaceAll = function (target, replace = "") {
    return this.split(target).join(replace);
}

module.exports = () => {
    const module = {};

    module.startServer = () => app.listen(3500, () => console.log("Milena server running on port 3500"));

    module.app = app;

    return module;
}