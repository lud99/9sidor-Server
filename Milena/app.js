
const express = require("express");
const app = express();

const cors = require("cors");

const request = require("request");

const cheerio = require('cheerio');

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
        const $ = cheerio.load(body);

        const urls = [];
        $(".blog-main .article h2 a").each((index, a) => {
            urls.push(a.attribs.href)
        });

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
        const $ = cheerio.load(body);

        const article = {
            url: url,
            subject: $(".blog-main .article.article-large .category-header").text(),
            subjectColor: $(".article.article-large .category-header").css("background-color"),
            imageSrc: $(".article.article-large img.size-large").attr("src"),
            imageText: $(".article.article-large .image-text").text(),
            title: $(".blog-main .article.article-large h2").text(),
            date: $("p.date").text(),
            comments: findCommentsByAuthor($, commentAuthor, searchExact)
        }

        callback(error, article);
    });
}

const findCommentsByAuthor = ($, authorName, searchExact) => {
    const allCommentAuthors = $("cite.fn");

    const comments = [];
    allCommentAuthors.each((index, authorElem) => {
        const $author = $(authorElem);

        const comment = $author.parent().parent();

        // Check if the author is exactly the same
        if (searchExact) {
            if ($author.text().toLowerCase().replaceAll(" ") == authorName.toLowerCase().replaceAll(" "))
                comments.push($.html(comment));
        } else { // Check if the specified name is somewhere in the author name
            if ($author.text().toLowerCase().replaceAll(" ").includes(authorName.toLowerCase().replaceAll(" ")))
                comments.push($.html(comment));
        }
    });

    return comments;
}

const get = (url, callback) => {
    const options = {
        uri: url,
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