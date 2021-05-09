const Article = require("../modules/Article");
const Subject = require("../modules/Subject");
const Image = require("../modules/Image");

const sanitizeHtml = require('sanitize-html');

const request = require("request");

const cloudinary = require('cloudinary').v2;

const Twitter = require('twitter');

// Get articles
const GetArticles = require("../utils/GetArticles");

// Get subjects
const GetSubjects = require("../utils/GetSubjects");

// Article formatting
const ArticleDataFormatter = require("../utils/ArticleDataFormatter");

// Error handling
const ErrorHandler = require("../utils/ErrorHandler");
const { response } = require("express");

if (process.env.TWITTER_API_KEY)
    var twitterClient = new Twitter({
        consumer_key: process.env.TWITTER_API_KEY,
        consumer_secret: process.env.TWITTER_API_SECRET_KEY,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
    });
else 
    var twitterClient = null;

/** 
 * Get articles with default formatting. Can get articles based on a specific subject, or get them all.
 * 
 * @route GET /api/v1/articles/default/:subject?page&limit
 * @access Public 
*/

exports.getArticlesDefault = async (req, res) => {
    // Setup options
    const options = GetArticles.options().get;
    options.articleFormat = ArticleDataFormatter.formats.default; // Default formatting

    const subject = req.params.subject || "all";

    // Get articles
    GetArticles.get(req.originalUrl, subject, (err, response) => {
        // Handle error
        if (err) return ErrorHandler.handleRouteError(res, err);

        res.status(200).json(response);
    }, options);
}

/**
 * Get a list of articles. Can get articles based on a specific subject, or get them all.
 * 
 * @route GET /api/v1/articles/list/:subject?page&limit
 * @access Public 
*/

exports.getArticlesList = async (req, res) => {
    // Check if a cache for the specified url exists
    if (cache.exists(req.originalUrl)) {
        // Get the cached response
        const response = cache.get(req.originalUrl);

        // Rucn the callback
        return res.status(200).json(response);
    }

    // Setup options
    const subjectOptions = { useCache: false }; // Don't automatically cache the response 

    // Get articles
    GetSubjects.get(req.originalUrl, (err, { data }) => {

        // If no subjects exist
        if (data.length === 0) {
            const response = { success: true, data: [] };

            // Cache the data
            cache.update(req.originalUrl, response);
            
            return res.status(200).json(response);
        }

        // Handle error
        if (err) return ErrorHandler.handleRouteError(res, err);

        const responseData = { subjects: data, articles: [] };

        let articleRequestsComplete = 0;

        // Iterate through each subject
        for (let i = 0; i < responseData.subjects.length; i++) {
            const subjectName = responseData.subjects[i].nameNormalized;

            // Create the url for getting the articles
            const url = `/api/articles/preview?subject=${subjectName || "all"}&page=${req.query.page || -1}&limit=${-1/*req.query.limit || 5*/}`

            // Setup options
            const options = GetArticles.options().get;
            options.articleFormat = ArticleDataFormatter.formats.preview; // Preview format
            options.populate = "subject"; // Don't get the image, only the subject

            GetArticles.get(url, subjectName, (err, { data }) => {
                // Handle error
                if (err) return ErrorHandler.handleRouteError(res, err);

                // Only add it if the subject has any articles
                if (data.length > 0)
                    data.forEach(article => responseData.articles.push(article)); // Add each article found individually to the array

                articleRequestsComplete++;

                // If all request have been completed
                if (articleRequestsComplete == responseData.subjects.length) {
                    // Format the data
                    responseData.articles = ArticleDataFormatter.format(responseData.articles, ArticleDataFormatter.formats.list);

                    // Sort it
                    responseData.articles = responseData.articles.subjects.sort(dynamicSort("index"));

                    // JSON Response
                    const response = {
                        success: true,
                        data: responseData.articles,
                    }

                    // Cache the data
                    cache.update(req.originalUrl, response);

                    return res.status(200).json(response);
                }
            }, options);
        }
    }, subjectOptions);
}

/** 
 * Get article from url
 * 
 * @route GET /api/v1/articles/url?url
 * @access Public 
*/

exports.getArticleFromUrl = async (req, res) => {
    // Setup options
    const options = GetArticles.options().get;
    options.articleFormat = ArticleDataFormatter.formats.default; // Default formatting
    options.customMongooseQuery = { url: req.query.url }
    options.getOne = true;

    // Get articles
    GetArticles.get(req.originalUrl, req.params.subject, (err, response) => {
        // Handle error
        if (err) return ErrorHandler.handleRouteError(res, err, undefined, 404);

        res.status(200).json(response);
    }, options);
}

/**
 * Add a new article
 * 
 * @route POST /api/v1/articles/add
 * @access Public 
*/

exports.addArticle = async (req, res) => {
    try {
        const data = req.body;

        // Get the subject name and make it lowercase
        const subjectNameLowercase = ((data.subject && data.subject.name) || "").toString().toLowerCase();

        const imageBase64 = (data.image && data.image.dataUri) || "";
        const imageUrl = (data.image && data.image.url) || "";

        // Get the image text
        const imageText = sanitizeHtml(((data.image && data.image.text) || "").toString(), strictSanitizeOptions);

        // Get the title
        const title = sanitizeHtml((data.title.toString() || ""), strictSanitizeOptions);

        // Make the title lowercase
        const titleLowercase = title.toLowerCase();

        // Normalize the title
        const titleNormalized = titleLowercase.removeSpecialCharacters();

        // Get the main text
        const mainText = sanitizeHtml((data.mainText || "").toString(), sanitizeOptions);

        if (!mainText) throw { message: "Ingen text angiven" };

        // Normalize the main text 
        const mainTextNormalized = mainText.toLowerCase().replaceAll("\n", " ").removeMultipleSpaces();

        // Get the preview text
        let previewText = sanitizeHtml((data.previewText || "").toString(), sanitizeOptions);

        // Use the first paragraph of the main text as the preview text if none is specified
        if (!previewText)
            previewText = mainText.split("<div><br /></div>")[0]; // First paragraph

        // Get the display date
        const displayDate = sanitizeHtml((data.displayDate || data.createdAt || "").toString(), strictSanitizeOptions);

        if (!displayDate) throw { message: "Inget datum angivet" };

        // Get the custom created at date
        const customCreatedAt = data.createdAt ? new Date(data.createdAt) : undefined;

        // Get the subject document for the specified subject
        const subject = await Subject.findOne({ nameLowercase: subjectNameLowercase });

        if (!subject) throw { message: "Ogiltigt ämne angivet" };

        const randomId = createId();

        // Replace the spaces with dashes
        const urlTitle = `${titleNormalized.replaceAll(" ", "-")}-${randomId}`;
        const oldUrlTitle = titleNormalized.replaceAll(" ", "-");

        let image = undefined;

        // If the article should have an image
        if (imageBase64 || imageUrl)
            image = await Image.create({
                url: imageUrl.slice(0, 5) === "https" ? imageUrl : "", // Create the image with an existing url, if it is an url. 
                                                                       // otherwise leave the url empty and add it later
                text: imageText
            });

        // Create the article
        let article = await Article.create({
            subject: subject._id,
            image: (image ? image._id : undefined), // Don't add an image if one wasn't specified
            title: title,
            titleLowercase: titleLowercase,
            titleNormalized: titleNormalized,
            mainText: mainText,
            mainTextNormalized: mainTextNormalized,
            previewText: previewText,
            displayDate: displayDate,
            hidden: data.hidden,
            showOnStartPage: data.showOnStartPage,
            createdAt: customCreatedAt
        });

        // Add the subject and image documents corresponding to the ids specified
        article = await Article.populate(article, "subject image");

        const urlDate = new Date(article.createdAt).
            toISOString(). // Convert it to yyyy-mm-dd
            slice(0, 7). // Only get yyyy-mm
            replaceAll("-", "/"); // Replace the dashes with slashes

        // Construct the url. Example: '/propaganda/2020/01/karlstad-fria-laroverken-roker-snus'
        article.url = `/${article.subject.nameNormalized}/${urlDate}/${urlTitle}`;
        article.oldUrl = `/${article.subject.nameNormalized}/${urlDate}/${oldUrlTitle}`;

        if (image && imageBase64) {
            await cloudinary.uploader.upload(imageBase64, async (error, result) => {
                if (error) throw error;

                console.log("Successfully saved the image '%s'", result.secure_url);

                image.url = result.secure_url;

                image = await image.save();

                article.image.url = image.url;

                return Promise.resolve();
            });
        }

        article = await article.save();

        console.log(`Successfully added the article '${title}'`);

        cache.clear();

       // tweetArticle(article);
        //sendArticleOnDiscord(article);

        // Send response
        return res.status(200).json({
            success: true,
            data: article
        });
    } catch (error) {
        // Handle error
        ErrorHandler.handleRouteError(res, error);
    }
}


/**
 * Edit an existing article
 * 
 * @route PATCH /api/v1/articles/edit
 * @access Public 
*/

exports.editArticle = async (req, res) => {
    try {
        const data = req.body;

        const article = await Article.findOne({ _id: req.query.articleId }).populate("image");
        let articleSubject = await Subject.findOne({ _id: article.subject });

        const getUrlTitle = (titleNormalized) => {
            const titleId = article.url.split("/").slice(4).join("-").slice(-4);

            // Replace the spaces with dashes
            return `${titleNormalized.replaceAll(" ", "-")}-${titleId}`;
        }

        const editUrl = (subjectNormalized, date, titleNormalized) => {
            var urlDate = new Date(date).
                toISOString("sv"). // Convert it to yyyy-mm-dd
                slice(0, 7). // Only get yyyy-mm
                replaceAll("-", "/"); // Replace the dashes with slashes

            // Replace the spaces with dashes
            const urlTitle = getUrlTitle(titleNormalized)

            article.url = `/${subjectNormalized}/${urlDate}/${urlTitle}`;
        }

        // Change the subject 
        if (data.subject) {
            const subjectNameLowercase = ((data.subject && data.subject.name) || "").toString().toLowerCase();

            // Get the subject document for the specified subject
            const subject = await Subject.findOne({ nameLowercase: subjectNameLowercase });

            if (!subject) throw { message: "Ogiltigt ämne angivet" };

            articleSubject = subject;

            article.subject = subject._id;

            editUrl(subject.nameNormalized, article.createdAt, article.titleNormalized);
        }

        // Change the title
        if (data.title) {
            const title = sanitizeHtml((data.title || "").toString(), strictSanitizeOptions);

            article.title = title;
            article.titleLowercase = title.toLowerCase();
            article.titleNormalized = article.titleLowercase.removeSpecialCharacters();

            editUrl(articleSubject.nameNormalized, article.createdAt, article.titleNormalized);
        }

        // Change the image text
        if (data.image && data.image.text) {
            const imageText = sanitizeHtml((data.image.text || "").toString(), strictSanitizeOptions);

            if (article.image) {
                article.image.text = imageText;

                await article.image.save();
            } else
                article.image = await Image.create({
                    url: "",
                    text: imageText
                });
        }

        // Change the image            
        if (data.image && data.image.dataUri) {
            await cloudinary.uploader.upload(data.image.dataUri, async (error, result) => {
                if (error) throw error;

                if (article.image) {
                    article.image.url = result.secure_url;

                    await article.image.save();
                } else {
                    article.image = await Image.create({
                        url: result.secure_url,
                        text: ""
                    });
                }

                console.log("Successfully saved the image '%s'", result.secure_url);

                return Promise.resolve();
            });
        }

        // Change the main text
        if (data.mainText) {
            let mainText = sanitizeHtml((data.mainText || "").toString(), sanitizeOptions);

            article.mainText = mainText;
            article.mainTextNormalized = mainText.toLowerCase().replaceAll("\n", " ").removeMultipleSpaces(); // Normalize the text

            if (!data.previewText) {
                // Use the first paragraph of the main text as the preview text if none is specified
                article.previewText = mainText.split("<div><br /></div>")[0]; // First paragraph
            }
        }

        // Change the preview text
        if (data.previewText) {
            const previewText = sanitizeHtml((data.previewText || "").toString(), sanitizeOptions);

            article.previewText = previewText;
        }

        // Change the display date
        if (data.displayDate) {
            const displayDate = sanitizeHtml((data.displayDate || "").toString(), strictSanitizeOptions);

            article.displayDate = displayDate;
        }

        // Change visibility
        if (data.hidden != null) {
            article.hidden = data.hidden;
        }

        // Change start page visibility
        if (data.showOnStartPage != null) {
            article.showOnStartPage = data.showOnStartPage;
        }

        cache.clear();

        await article.save();

        res.status(200).json({
            success: true,
            data: article
        });
    } catch (error) {
        // Handle error
        ErrorHandler.handleRouteError(res, error);
    }
}


exports.deleteArticle = async (req, res) => {
    try {
        await Article.deleteOne({ _id: req.body.articleId });

        cache.clear();

        res.status(200).json({
            success: true,
        });
    } catch (error) {
        // Handle error
        ErrorHandler.handleRouteError(res, error);
    }
}

exports.deleteAllArticles = async (req, res) => {
    try {
        const pass = req.body.password;

        if (pass != process.env.SECRET_PASSWORD) 
            return res.status(401).json({
                success: false,
                error: "Fel lösenord"
            });

        await Article.deleteMany();

        cache.clear();

        res.status(200).json({
            success: true,
        });
    } catch (error) {
        // Handle error
        ErrorHandler.handleRouteError(res, error);
    }
}

exports.tweetArticle = async (req, res) => {
    const id = req.params.id;

    const article = await Article.findOne({ _id: id }).populate("subject image");

    if (article) {
        tweetArticle(article, () => res.json({ success: true }));
    } else {
        return res.json({ success: false });
    }
} 

exports.sendArticleDiscord = async (req, res) => {
    const id = req.params.id;

    console.log(id);

    const article = await Article.findOne({ _id: id }).populate("subject image");

    if (article) {
        sendArticleOnDiscord(article, () => res.json({ success: true }));
    } else {
        return res.json({ success: false });
    }
} 

const dynamicSort = (property) => {
    var sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a, b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

const createId = (len = 4, chars = '0123456789') => {
    let id = "";
    while (len--) {
        id += chars[Math.random() * chars.length | 0];
    }
    return id;
}

const tweetArticle = async ({ title, url, previewText, image }, callback = () => {}) => {
    if (!twitterClient) return;

    if (process.env.NODE_ENV === "development") return; // Don't tweet in dev mode

    const text = previewText.replaceAll("<div>", "\n")
        .replaceAll("</div>", "")
        .replaceAll("<br>", "\n")
        .replaceAll("&nbsp;", " ")
        .replaceAll("<br />", "\n");

    console.log(text,  `${text}\n\nhttps://9sidor.ml/sv${url}`.length);
    
    const tweet = (media) => {
        const tweetStatus = {
            status: `${text}\n\nhttps://9sidor.ml/sv${url}`,

            media_ids: media ? media.media_id_string : undefined
        }


        twitterClient.post('statuses/update', tweetStatus, error => {
            if (error) return console.error(error);
            
            console.log("Tweeted article '%s'", title);

            return callback(tweet);
        })
    }

    if (image && image.url) {
        request.get(image.url, { encoding: null }, async (error, response, body) => {
            if (!error) {
                twitterClient.post('media/upload', { media: body }, async (error, media) => {
                    console.log("Uploaded tweet image")

                    tweet(media);
                });
            }
        });
    } else {
        tweet()
    }    
}

const sendArticleOnDiscord = (article, callback) => {
    const discordUrl = process.env.NOVE_ENV === "development" ? process.env.DISCORD_API_URL_DEV : process.env.DISCORD_API_URL_PROD;
    if (!discordUrl) return;

    const url = discordUrl + "/api/v1/post-article";

    request({
        uri: url,
        method: "POST",
        json: article,
        headers: {'content-type' : 'application/json'}
    }, (error, response, body) => {
        if (error) console.log("Discord bot error", error);
        else if (callback) callback();
    });
}

const sanitizeOptions = {
    allowedTags: ['b', 'i', 'u', 'br', 'div'],
    allowedAttributes: {}
}

const strictSanitizeOptions = {
    allowedTags: [],
    allowedAttributes: {}
}