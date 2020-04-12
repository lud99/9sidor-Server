const Article = require("../modules/Article");
const Subject = require("../modules/Subject");
const Image = require("../modules/Image");

// Get articles
const GetArticles = require("../utils/GetArticles");

// Get subjects
const GetSubjects = require("../utils/GetSubjects");

// Article formatting
const ArticleDataFormatter = require("../utils/ArticleDataFormatter");

// Error handling
const ErrorHandler = require("../utils/ErrorHandler");

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
 * Get articles with internal formatting (directly from the database). Can get articles based on a specific subject, or get them all.
 * 
 * @route GET /api/v1/articles/internal/:subject?page&limit
 * @access Public 
*/

exports.getArticlesInternal = async (req, res) => {
    // Setup options
    const options = GetArticles.options().get;
    options.articleFormat = ArticleDataFormatter.formats.internal; // Internal formatting

    // Get articles
    GetArticles.get(req.originalUrl, req.params.subject, (err, response) => {
        // Handle error
        if (err) return ErrorHandler.handleRouteError(res, err);

        res.status(200).json(response);
    }, options);
}

/** 
 * Get articles with preview formatting. Can get articles based on a specific subject, or get them all.
 * 
 * @route GET /api/v1/articles/preview/:subject?page&limit
 * @access Public 
*/

exports.getArticlesPreview = async (req, res) => {
    // Setup options
    const options = GetArticles.options().get;
    options.articleFormat = ArticleDataFormatter.formats.preview; // Preview formatting

    // Get articles
    GetArticles.get(req.originalUrl, req.params.subject, (err, response) => {
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
        console.log("Loading from cache", req.originalUrl);

        // Get the cached response
        const response = cache.get(req.originalUrl);

        // Rucn the callback
        return res.status(200).json(response);
    }

    // Setup options
    const subjectOptions = { useCache: false }; // Don't automatically cache the response 

    // Get articles
    GetSubjects.get(req.originalUrl, (err, { data }) => {
        // Handle error
        if (err) return ErrorHandler.handleRouteError(res, err);

        const responseData = { subjects: data, articles: [] };

        let articleRequestsComplete = 0;

        // Iterate through each subject
        for (let i = 0; i < responseData.subjects.length; i++) {
            const subjectName = responseData.subjects[i].nameNormalized;

            // Create the url for getting the articles
            const url = `/api/articles/preview?subject=${subjectName || "all"}&page=${req.query.page || -1}&limit=${req.query.limit || 5}`

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

                    // TODO: Add correct sorting

                    // JSON Response
                    const response = {
                        success: true,
                        data: responseData.articles.subjects
                    }

                    // Cache the data
                    cache.update(req.originalUrl, response);

                    console.log("Updating the cache for", req.originalUrl);

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
        if (err) return ErrorHandler.handleRouteError(res, err);

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
        const subjectNameLowercase = data.subject.toString().toLowerCase();

        // Get the image url
        const imageUrl = data.imageUrl;

        // Get the image text
        const imageText = (data.imageText || "").toString()

        // Get the title
        const title = data.title.toString();

        // Make the title lowercase
        const titleLowercase = title.toLowerCase();

        // Normalize the title
        const titleNormalized = titleLowercase.removeSpecialCharacters();

        // Get the main text
        const mainText = data.mainText.toString();

        // Normalize the main text 
        const mainTextNormalized = mainText.toLowerCase().replaceAll("\n", " ").removeMultipleSpaces();

        // Get the preview text
        let previewText = (data.previewText || "").toString();

        // Use the first paragraph of the main text as the preview text if none is specified
        if (!previewText)
            previewText = mainText.split("\n\n")[0]; // First paragraph

        // Get the display date
        const displayDate = (data.displayDate || data.createdAt).toString();

        // Get the custom created at date
        const customCreatedAt = new Date(data.createdAt);

        // Get the subject document for the specified subject
        const subject = await Subject.findOne({ nameLowercase: subjectNameLowercase });
        
        // If the article should have an image
        if (imageUrl) {
            // Find that image
            var image = await Image.findOne({ url: imageUrl });

            if (!image) {
                image = await Image.create({
                    url: imageUrl,
                    text: imageText
                });
            }
        }

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
            createdAt: customCreatedAt
        });
        
        // Add the subject and image documents corresponding to the ids specified
        article = await Article.populate(article, "subject image");
        
        const createdAt = article.createdAt;

        const urlDate = new Date(createdAt).
            toISOString(). // Convert it to yyyy-mm-dd
            slice(0, 7). // Only get yyyy-mm
            replaceAll("-", "/"); // Replace the dashes with 
            
        // Replace the spaces with dashes
        const urlTitle = titleNormalized.replaceAll(" ", "-");

        // Construc the url. Example: '/propaganda/2020/01/karlstad-fria-laroverken-roker-snus'
        article.url = `/${article.subject.nameNormalized}/${urlDate}/${urlTitle}`;

        article = await article.save();

        console.log(`Successfully added the article '${title}'`);

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